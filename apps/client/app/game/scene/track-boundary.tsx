import type { Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { useDebugTuning } from '../../dev/debug-tuning';
import { segmentCount } from './track-floor';
import {
    BOUNDARY_H,
    BOUNDARY_VARIANT,
    BOUNDARY_W,
    type BoundaryVariant,
    inwardFalloff,
    isOutboard,
    isOuterEdge,
    isRaised,
    packGeometry,
    pushQuad,
    UP,
} from './track-geometry';
import { BOUNDARY_SURFACE, boundarySoftSurface, MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

/** One outer edge: `s` is −1 at the track's left edge and +1 at its right, and every variant is
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
    variant: BoundaryVariant,
): void {
    const out = x + s * w;

    if ( isRaised( variant ) ) {
        // Top and inner face only: the band's outer face and end section come from the slab.
        const u = y + h;
        pushQuad( pos, uv, [ x, u, z0 ], [ x, u, z1 ], [ out, u, z1 ], [ out, u, z0 ], 'xz', UP );
        if ( h > 1e-4 ) pushQuad( pos, uv, [ x, y, z0 ], [ x, y, z1 ], [ x, u, z1 ], [ x, u, z0 ], 'zy', [ -s, 0, 0 ] );
        return;
    }

    const d = y - h;
    if ( isOutboard( variant ) ) {
        // The slab's own wall picks up at the flare's outer lip, so there is no vertical face here.
        pushQuad( pos, uv, [ x, y, z0 ], [ x, y, z1 ], [ out, d, z1 ], [ out, d, z0 ], 'xz', [ s * h, w, 0 ] );
        return;
    }

    const inner = x - s * w;
    pushQuad( pos, uv, [ x, y, z0 ], [ x, y, z1 ], [ inner, y, z1 ], [ inner, y, z0 ], 'xz', UP );
    pushQuad( pos, uv, [ x, d, z0 ], [ x, y, z0 ], [ x, y, z1 ], [ x, d, z1 ], 'zy', [ s, 0, 0 ] );
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
    variant: BoundaryVariant,
): void {
    const { x0, x1, y } = span;
    if ( isOuterEdge( x0 ) ) emitEdge( pos, uv, x0, -1, y, z0, z1, w, h, variant );
    if ( isOuterEdge( x1 ) ) emitEdge( pos, uv, x1, 1, y, z0, z1, w, h, variant );
}

/** The boundary on one slab span, for showing the corner outside the game (the gallery). */
export function buildBoundarySpanGeometry(
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    w = BOUNDARY_W,
    h = BOUNDARY_H,
    variant: BoundaryVariant = BOUNDARY_VARIANT,
): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitBoundary( pos, uv, { x0, x1, y: 0 }, z0, z1, w, h, variant );
    return packGeometry( pos, uv, variant === 'C' ? inwardFalloff( w ) : undefined );
}

/** Baked over the deck's own segment range, not instanced from a moving Z-window: it is part of the slab. */
function buildBoundaryGeometry( track: Track, w: number, h: number, variant: BoundaryVariant ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );

    for ( let i = 0; i < last; i++ ) {
        const seg = track.segmentAt( i );
        for ( const f of seg.floors ) emitBoundary( pos, uv, f, seg.z0, seg.z1, w, h, variant );
    }

    return packGeometry( pos, uv, variant === 'C' ? inwardFalloff( w ) : undefined );
}

export function TrackBoundary( { track }: { track: Track } ) {
    const tuning = useDebugTuning();
    const w = import.meta.env.DEV ? tuning.boundaryWidth : BOUNDARY_W;
    const h = import.meta.env.DEV ? tuning.boundaryWrap : BOUNDARY_H;
    const variant = import.meta.env.DEV ? tuning.boundaryVariant : BOUNDARY_VARIANT;
    const geo = useMemo( () => buildBoundaryGeometry( track, w, h, variant ), [ track, w, h, variant ] );

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    return (
        <mesh geometry={ geo }>
            { /* Keyed so each variant gets a FRESH material: C adds `map`/`emissiveMap`, and R3F never
                 restores a prop that merely stopped being passed. */ }
            <meshStandardMaterial
                key={ variant }
                { ...( variant === 'C' ? boundarySoftSurface() : BOUNDARY_SURFACE ) }
                emissiveIntensity={ import.meta.env.DEV ? tuning.marigoldReference : MARIGOLD_REFERENCE_INTENSITY }
            />
        </mesh>
    );
}
