import { LEAD_SEGMENTS, type Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { useDebugTuning } from '../../dev/debug-tuning';
import { segmentCount } from './track-floor';
import { BOUNDARY_H, BOUNDARY_W, isOuterEdge, packGeometry, pushQuad, UP } from './track-geometry';
import { BOUNDARY_SURFACE, MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

/** One outer edge: `s` is −1 at the track's left edge and +1 at its right, and the rail is
 *  mirror-symmetric, so the sign carries the whole difference. Vertices are world-space — no pivot. */
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
    // Starts AT the track edge and runs outward: the deck never pays for the rail (ADR-012).
    const out = x + s * w;
    const u = y + h;

    // Top and inner face only: the band's outer face and end section come from the slab.
    pushQuad( pos, uv, [ x, u, z0 ], [ x, u, z1 ], [ out, u, z1 ], [ out, u, z0 ], 'xz', UP );
    // The riser faces INWARD — an outward one is invisible from the chase cam, with every gate green.
    if ( h > 1e-4 ) pushQuad( pos, uv, [ x, y, z0 ], [ x, y, z1 ], [ x, u, z1 ], [ x, u, z0 ], 'zy', [ -s, 0, 0 ] );
}

/** The marigold face at a span's outer edges. It follows the SPAN, because it needs a slab to sit on. */
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

/** The boundary on one slab span, for showing the corner outside the game (the gallery). */
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

/** Baked over the deck's own segment range, not instanced from a moving Z-window: it is part of the slab. */
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
    const tuning = useDebugTuning();
    const w = import.meta.env.DEV ? tuning.boundaryWidth : BOUNDARY_W;
    const h = import.meta.env.DEV ? tuning.boundaryWrap : BOUNDARY_H;
    const geo = useMemo( () => buildBoundaryGeometry( track, w, h ), [ track, w, h ] );

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial
                { ...BOUNDARY_SURFACE }
                emissiveIntensity={ import.meta.env.DEV ? tuning.marigoldReference : MARIGOLD_REFERENCE_INTENSITY }
            />
        </mesh>
    );
}
