import { useFrame } from '@react-three/fiber';
import { CELL, LEAD_SEGMENTS, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { createEmitterUniforms, EMITTER_SLOTS, parkEmitter, patchEmitterLight, writeEmitter } from './emitter-array';
import {
    BACKWARD,
    BOUNDARY_H,
    BOUNDARY_W,
    DOWN,
    FORWARD,
    isOuterEdge,
    LEFT,
    packGeometry,
    pushQuad,
    RIGHT,
    UP,
    type V3,
} from './track-geometry';
import { AHEAD } from './track-instancing';
import {
    FLOOR_ENV_MAP_INTENSITY,
    FLOOR_METALNESS,
    FLOOR_ROUGHNESS,
    floorSurface,
    MARIGOLD_EMISSIVE,
    RAIL_EMITTER_DECAY,
    RAIL_EMITTER_INTENSITY,
    RAIL_EMITTER_LIFT,
    RAIL_EMITTER_RANGE,
} from './track-materials';
import { buildRailRuns, type RailRun, railRunDistance } from './track-rails';

const RAIL_COLOR = new THREE.Color( MARIGOLD_EMISSIVE );
const _view = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _near: RailRun[] = [];
const _dist: number[] = [];

function feedEmitters(
    uniforms: ReturnType< typeof createEmitterUniforms >,
    runs: RailRun[],
    z: number,
    camera: THREE.Camera,
    intensity: number,
    range: number,
): void {
    uniforms.uEmitterAxis.value.copy( _axis.set( 0, 0, 1 ).transformDirection( camera.matrixWorldInverse ) );

    const n = selectNearest( runs, z, EMITTER_SLOTS );
    let slot = 0;
    for ( let i = 0; i < n; i++ ) {
        const run = _near[ i ];
        const z0 = Math.max( run.z0, z - range );
        const z1 = Math.min( run.z1, z + range );
        if ( z1 <= z0 ) continue;
        _view.set( run.x, run.y, ( z0 + z1 ) / 2 ).applyMatrix4( camera.matrixWorldInverse );
        writeEmitter( uniforms, slot, _view, ( z1 - z0 ) / 2, RAIL_COLOR, intensity, range );
        slot++;
    }
    for ( let i = slot; i < EMITTER_SLOTS; i++ ) parkEmitter( uniforms, i );
}

function selectNearest( runs: RailRun[], z: number, limit: number ): number {
    let n = 0;
    for ( const run of runs ) {
        const d = railRunDistance( run, z );
        let at = n;
        while ( at > 0 && _dist[ at - 1 ] > d ) at--;
        if ( at >= limit ) continue;
        for ( let k = Math.min( n, limit - 1 ); k > at; k-- ) {
            _near[ k ] = _near[ k - 1 ];
            _dist[ k ] = _dist[ k - 1 ];
        }
        _near[ at ] = run;
        _dist[ at ] = d;
        if ( n < limit ) n++;
    }
    return n;
}

export const SLAB_THICKNESS = 2;

function continues( other: Segment | null, x0: number, x1: number, y: number ): boolean {
    return other
        ? other.floors.some( ( f ) => f.x0 <= x0 + 1e-4 && f.x1 >= x1 - 1e-4 && Math.abs( f.y - y ) < 1e-4 )
        : false;
}

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
    w: number,
    h: number,
): void {
    const { x0, x1 } = span;
    const t = span.y;
    const b = span.y - SLAB_THICKNESS;
    const sideL = isOuterEdge( x0 ) ? x0 - w : x0;
    const sideR = isOuterEdge( x1 ) ? x1 + w : x1;
    const lip = t + h;
    const lipL = isOuterEdge( x0 ) ? lip : t;
    const lipR = isOuterEdge( x1 ) ? lip : t;

    pushQuad( pos, uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'xz', UP );

    pushQuad( pos, uv, [ sideL, b, z0 ], [ sideL, lipL, z0 ], [ sideL, lipL, z1 ], [ sideL, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ sideR, lipR, z0 ], [ sideR, b, z0 ], [ sideR, b, z1 ], [ sideR, lipR, z1 ], 'zy', RIGHT );

    const cap = ( z: number, n: V3 ) => {
        if ( sideL < x0 - 1e-4 )
            pushQuad( pos, uv, [ sideL, b, z ], [ x0, b, z ], [ x0, t, z ], [ sideL, lipL, z ], 'xy', n );
        pushQuad( pos, uv, [ x0, b, z ], [ x1, b, z ], [ x1, t, z ], [ x0, t, z ], 'xy', n );
        if ( sideR > x1 + 1e-4 )
            pushQuad( pos, uv, [ x1, b, z ], [ sideR, b, z ], [ sideR, lipR, z ], [ x1, t, z ], 'xy', n );
    };
    if ( capFront ) cap( z0, BACKWARD );
    if ( capBack ) cap( z1, FORWARD );

    pushQuad( pos, uv, [ sideL, b, z0 ], [ sideL, b, z1 ], [ sideR, b, z1 ], [ sideR, b, z0 ], 'xz', DOWN );
}

export function buildSpanGeometry(
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    w = BOUNDARY_W,
    h = BOUNDARY_H,
): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitSpan( pos, uv, { x0, x1, y: 0 }, z0, z1, true, true, w, h );
    return packGeometry( pos, uv );
}

export function segmentCount( track: Track ): number {
    return Math.round( track.finishZ / SEG_LEN ) + Math.ceil( AHEAD / SEG_LEN );
}

function buildFloorGeometry( track: Track, w: number, h: number ): THREE.BufferGeometry {
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
            emitSpan(
                pos,
                uv,
                f,
                seg.z0,
                seg.z1,
                ! continues( prev, f.x0, f.x1, f.y ),
                ! continues( next, f.x0, f.x1, f.y ),
                w,
                h,
            );
        }
    }

    return packGeometry( pos, uv );
}

export function TrackFloor( { track }: { track: Track } ) {
    const world = useWorld();
    const w = BOUNDARY_W;
    const h = BOUNDARY_H;
    const geo = useMemo( () => buildFloorGeometry( track, w, h ), [ track, w, h ] );
    const lift = RAIL_EMITTER_LIFT;
    const runs = useMemo( () => buildRailRuns( track, segmentCount( track ), w, h, lift ), [ track, w, h, lift ] );
    const uniforms = useMemo( createEmitterUniforms, [] );
    const matRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const patched = useRef( false );
    const range = RAIL_EMITTER_RANGE;
    const intensity = RAIL_EMITTER_INTENSITY;
    const decay = RAIL_EMITTER_DECAY;

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    useFrame( ( { camera } ) => {
        const mat = matRef.current;
        if ( ! mat ) return;
        if ( ! patched.current ) {
            patchEmitterLight( mat, uniforms );
            patched.current = true;
        }

        uniforms.uEmitterDecay.value = decay;
        const z = world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.z ?? 0;
        feedEmitters( uniforms, runs, z, camera, intensity, range );
    } );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial
                ref={ matRef }
                { ...floorSurface() }
                roughness={ FLOOR_ROUGHNESS }
                metalness={ FLOOR_METALNESS }
                envMapIntensity={ FLOOR_ENV_MAP_INTENSITY }
            />
        </mesh>
    );
}
