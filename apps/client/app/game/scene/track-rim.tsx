import { useFrame } from '@react-three/fiber';
import { CELL, type FloorSpan, LEAD_SEGMENTS, type Segment, spanHasZ, type Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { accent } from './accent';
import { segmentCount } from './track-floor';
import { isOuterEdge } from './track-geometry';
import { MARIGOLD_REFERENCE_INTENSITY } from './track-materials';
import { type SpanEdges, spanEdges } from './track-openings';

export const CORD_RADIUS = 0.08;
export const CORD_SEGMENTS = 8;
export const CORD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY;
export const CORD_DEPTH_BIAS = -2;

export interface Cord {
    x: number;
    y: number;
    z: number;
    length: number;
    alongZ: boolean;
}

interface Run {
    from: number;
    to: number;
}

export function floorAt( track: Track, x: number, z: number, y: number ): boolean {
    const seg = track.segmentAtZ( z );
    return seg.floors.some( ( f ) => spanHasZ( seg, f, z ) && x >= f.x0 && x <= f.x1 && Math.abs( f.y - y ) < 1e-4 );
}

function openRuns( from: number, to: number, isOpen: ( mid: number ) => boolean ): Run[] {
    const cells = Math.max( 1, Math.round( ( to - from ) / CELL ) );
    const step = ( to - from ) / cells;
    const runs: Run[] = [];
    let open: Run | null = null;
    for ( let k = 0; k < cells; k++ ) {
        const a = from + k * step;
        if ( ! isOpen( a + step / 2 ) ) {
            open = null;
            continue;
        }
        if ( open ) open.to = a + step;
        else {
            open = { from: a, to: a + step };
            runs.push( open );
        }
    }
    return runs;
}

function sideCords( out: Cord[], track: Track, f: FloorSpan, e: SpanEdges, right: boolean ): void {
    const x = right ? f.x1 : f.x0;
    if ( e.outer && isOuterEdge( x ) ) return;
    const probe = right ? x + CELL / 2 : x - CELL / 2;
    for ( const run of openRuns( e.z0, e.z1, ( z ) => ! floorAt( track, probe, z, f.y ) ) ) {
        out.push( {
            x,
            y: f.y,
            z: ( run.from + run.to ) / 2,
            length: run.to - run.from + 2 * CORD_RADIUS,
            alongZ: true,
        } );
    }
}

function capCords( out: Cord[], track: Track, f: FloorSpan, e: SpanEdges, back: boolean ): void {
    const z = back ? e.z1 : e.z0;
    const probe = back ? z + CELL / 2 : z - CELL / 2;
    for ( const run of openRuns( f.x0, f.x1, ( x ) => ! floorAt( track, x, probe, f.y ) ) ) {
        out.push( {
            x: ( run.from + run.to ) / 2,
            y: f.y,
            z,
            length: run.to - run.from + 2 * CORD_RADIUS,
            alongZ: false,
        } );
    }
}

export function buildCords( track: Track ): Cord[] {
    const out: Cord[] = [];
    const last = segmentCount( track );

    for ( let i = -LEAD_SEGMENTS; i < last; i++ ) {
        const seg = track.segmentAt( i );
        const prev: Segment | null = i > -LEAD_SEGMENTS ? track.segmentAt( i - 1 ) : null;
        const next: Segment | null = i < last - 1 ? track.segmentAt( i + 1 ) : null;
        for ( const f of seg.floors ) {
            const e = spanEdges( seg, prev, next, f );
            sideCords( out, track, f, e, false );
            sideCords( out, track, f, e, true );
            if ( e.capFront ) capCords( out, track, f, e, false );
            if ( e.capBack ) capCords( out, track, f, e, true );
        }
    }

    return out;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const ALONG_Z = new THREE.Euler( Math.PI / 2, 0, 0 );
const ALONG_X = new THREE.Euler( 0, 0, Math.PI / 2 );

function buildCordMesh( track: Track ): THREE.InstancedMesh {
    const cords = buildCords( track );
    const geo = new THREE.CylinderGeometry( CORD_RADIUS, CORD_RADIUS, 1, CORD_SEGMENTS );
    const mat = new THREE.MeshStandardMaterial( {
        color: '#000000',
        emissive: accent(),
        emissiveIntensity: CORD_INTENSITY,
        polygonOffset: true,
        polygonOffsetFactor: CORD_DEPTH_BIAS,
        polygonOffsetUnits: CORD_DEPTH_BIAS,
    } );
    const mesh = new THREE.InstancedMesh( geo, mat, Math.max( 1, cords.length ) );
    mesh.count = cords.length;
    mesh.frustumCulled = false;

    for ( let i = 0; i < cords.length; i++ ) {
        const c = cords[ i ];
        _pos.set( c.x, c.y, c.z );
        _q.setFromEuler( c.alongZ ? ALONG_Z : ALONG_X );
        _scale.set( 1, c.length, 1 );
        mesh.setMatrixAt( i, _m.compose( _pos, _q, _scale ) );
    }
    mesh.instanceMatrix.needsUpdate = true;

    return mesh;
}

export function TrackRim( { track }: { track: Track } ) {
    const mesh = useMemo( () => buildCordMesh( track ), [ track ] );

    useFrame( () => {
        ( mesh.material as THREE.MeshStandardMaterial ).emissiveIntensity = num( 'Rail.rimEmissive' );
    } );

    // GPU buffers outlive React's tree: a mesh replaced by a track change must be released by hand.
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            ( mesh.material as THREE.Material ).dispose();
            mesh.dispose();
        },
        [ mesh ],
    );

    return <primitive object={ mesh } />;
}
