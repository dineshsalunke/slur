import { LEAD_SEGMENTS, type Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { segmentCount } from './track-floor';
import { BOUNDARY_H, BOUNDARY_W, isOuterEdge, packGeometry, pushQuad, UP } from './track-geometry';
import { BOUNDARY_SURFACE, MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

function emitEdge(
    pos: number[],
    uv: number[],
    x: number,
    s: number,
    y: number,
    z0: number,
    z1: number,
    w: number,
    h: number,
): void {
    const out = x + s * w;
    const u = y + h;

    pushQuad( pos, uv, [ x, u, z0 ], [ x, u, z1 ], [ out, u, z1 ], [ out, u, z0 ], 'xz', UP );
    if ( h > 1e-4 ) pushQuad( pos, uv, [ x, y, z0 ], [ x, y, z1 ], [ x, u, z1 ], [ x, u, z0 ], 'zy', [ -s, 0, 0 ] );
}

function emitBoundary(
    pos: number[],
    uv: number[],
    span: { x0: number; x1: number; y: number },
    z0: number,
    z1: number,
    w: number,
    h: number,
): void {
    const { x0, x1, y } = span;
    if ( isOuterEdge( x0 ) ) emitEdge( pos, uv, x0, -1, y, z0, z1, w, h );
    if ( isOuterEdge( x1 ) ) emitEdge( pos, uv, x1, 1, y, z0, z1, w, h );
}

export function buildBoundarySpanGeometry(
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    w = BOUNDARY_W,
    h = BOUNDARY_H,
): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitBoundary( pos, uv, { x0, x1, y: 0 }, z0, z1, w, h );
    return packGeometry( pos, uv );
}

function buildBoundaryGeometry( track: Track, w: number, h: number ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );

    for ( let i = -LEAD_SEGMENTS; i < last; i++ ) {
        const seg = track.segmentAt( i );
        for ( const f of seg.floors ) emitBoundary( pos, uv, f, seg.z0, seg.z1, w, h );
    }

    return packGeometry( pos, uv );
}

export function TrackBoundary( { track }: { track: Track } ) {
    const w = BOUNDARY_W;
    const h = BOUNDARY_H;
    const geo = useMemo( () => buildBoundaryGeometry( track, w, h ), [ track, w, h ] );

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial { ...BOUNDARY_SURFACE } emissiveIntensity={ MARIGOLD_REFERENCE_INTENSITY } />
        </mesh>
    );
}
