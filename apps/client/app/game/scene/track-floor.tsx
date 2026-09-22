import { useFrame } from '@react-three/fiber';
import { CELL, LEAD_SEGMENTS, SEG_LEN, type Track } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { num } from '../../dev/tunables';
import { useRebuildToken } from '../../dev/use-tunables';
import {
    BACKWARD,
    DOWN,
    FORWARD,
    LEFT,
    packGeometry,
    pushQuad,
    RIGHT,
    SLAB_THICKNESS,
    UP,
    type V3,
} from './track-geometry';
import { AHEAD } from './track-instancing';
import { cleanToMapRoughness, floorSurface } from './track-materials';
import { spanEdges } from './track-openings';

const isOffGrid = ( v: number ) => {
    const m = Math.abs( v % CELL );
    return m > 1e-4 && Math.abs( m - CELL ) > 1e-4;
};

function emitSpan(
    pos: number[],
    uv: number[],
    span: { x0: number; x1: number; y: number },
    z0: number,
    z1: number,
    capFront: boolean,
    capBack: boolean,
): void {
    const { x0, x1 } = span;
    const t = span.y;
    const b = span.y - SLAB_THICKNESS;

    pushQuad( pos, uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'xz', UP );

    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, t, z0 ], [ x0, t, z1 ], [ x0, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ x1, t, z0 ], [ x1, b, z0 ], [ x1, b, z1 ], [ x1, t, z1 ], 'zy', RIGHT );

    const cap = ( z: number, n: V3 ) =>
        pushQuad( pos, uv, [ x0, b, z ], [ x1, b, z ], [ x1, t, z ], [ x0, t, z ], 'xy', n );
    if ( capFront ) cap( z0, BACKWARD );
    if ( capBack ) cap( z1, FORWARD );

    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, b, z1 ], [ x1, b, z1 ], [ x1, b, z0 ], 'xz', DOWN );
}

export function buildSpanGeometry( x0: number, x1: number, z0: number, z1: number ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitSpan( pos, uv, { x0, x1, y: 0 }, z0, z1, true, true );
    return packGeometry( pos, uv );
}

export function segmentCount( track: Track ): number {
    return Math.round( track.finishZ / SEG_LEN ) + Math.ceil( AHEAD / SEG_LEN );
}

function buildFloorGeometry( track: Track ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );

    for ( let i = -LEAD_SEGMENTS; i < last; i++ ) {
        const seg = track.segmentAt( i );
        const prev = i > -LEAD_SEGMENTS ? track.segmentAt( i - 1 ) : null;
        const next = i < last - 1 ? track.segmentAt( i + 1 ) : null;

        for ( const f of seg.floors ) {
            if ( import.meta.env.DEV && ( isOffGrid( f.x0 ) || isOffGrid( f.x1 ) ) ) {
                console.warn( `[track-floor] seg ${ i } span not CELL-aligned: ${ f.x0 }..${ f.x1 }` );
            }
            const e = spanEdges( seg, prev, next, f );
            emitSpan( pos, uv, f, e.z0, e.z1, e.capFront, e.capBack );
        }
    }

    return packGeometry( pos, uv );
}

export function TrackFloor( { track }: { track: Track } ) {
    const geo = useMemo( () => buildFloorGeometry( track ), [ track ] );
    const matRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const rebuild = useRebuildToken();
    const surface = useMemo( floorSurface, [ rebuild ] );

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    useFrame( () => {
        const mat = matRef.current;
        if ( ! mat ) return;

        mat.metalness = num( 'deck.metalness' );
        mat.roughness = cleanToMapRoughness( num( 'deck.roughness' ) );
        mat.envMapIntensity = num( 'deck.envMapIntensity' );
        mat.normalScale.set( num( 'deck.normalScale' ), num( 'deck.normalScale' ) );
    } );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial ref={ matRef } { ...surface } />
        </mesh>
    );
}
