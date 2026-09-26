import { CELL, type FloorSpan, LEAD_SEGMENTS, type Segment, spanHasZ, type Track } from '@slur/shared';
import * as THREE from 'three';
import { accent } from '../accent';
import { segmentCount } from '../track-floor/track-floor.utils';
import { isOuterEdge } from '../track-geometry';
import { type SpanEdges, spanEdges } from '../track-openings';
import type { Cord, Run } from './track-rim';
import {
    _m,
    _pos,
    _q,
    _scale,
    ALONG_X,
    ALONG_Z,
    CORD_DEPTH_BIAS,
    CORD_INTENSITY,
    CORD_RADIUS,
    CORD_SEGMENTS,
} from './track-rim.constants';

export function floorAt( track: Track, x: number, z: number, y: number ): boolean {
    const seg = track.segmentAtZ( z );
    return seg.floors.some( ( f ) => spanHasZ( seg, f, z ) && x >= f.x0 && x <= f.x1 && Math.abs( f.y - y ) < 1e-4 );
}

export function openRuns( from: number, to: number, isOpen: ( mid: number ) => boolean ): Run[] {
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

export function sideCords( out: Cord[], track: Track, f: FloorSpan, e: SpanEdges, right: boolean ): void {
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

export function capCords( out: Cord[], track: Track, f: FloorSpan, e: SpanEdges, back: boolean ): void {
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

export function buildCordMesh( track: Track ): THREE.InstancedMesh {
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
