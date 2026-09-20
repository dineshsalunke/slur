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
    LEFT,
    packGeometry,
    pushQuad,
    RIGHT,
    UP,
} from './track-geometry';
import { BOUNDARY_SURFACE, boundarySoftSurface, MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

/** NOT a rail: board 24 panel 02 excludes "raised rails", so the strip IS the slab's top outer corner,
 *  carrying M7. It follows the SPAN, because a strip embedded in the slab needs a slab. */
function emitBoundary(
    pos: number[],
    uv: number[],
    span: { x0: number; x1: number; y: number },
    z0: number,
    z1: number,
    w: number,
    h: number,
    outboard: boolean,
): void {
    const { x0, x1, y } = span;
    const d = y - h;

    if ( isOuterEdge( x0 ) ) {
        if ( outboard ) {
            // The slab's own wall picks up at the flare's outer lip, so there is no vertical face here.
            pushQuad( pos, uv, [ x0, y, z0 ], [ x0, y, z1 ], [ x0 - w, d, z1 ], [ x0 - w, d, z0 ], 'xz', [ -h, w, 0 ] );
        } else {
            const i = x0 + w;
            pushQuad( pos, uv, [ x0, y, z0 ], [ x0, y, z1 ], [ i, y, z1 ], [ i, y, z0 ], 'xz', UP );
            pushQuad( pos, uv, [ x0, d, z0 ], [ x0, y, z0 ], [ x0, y, z1 ], [ x0, d, z1 ], 'zy', LEFT );
        }
    }
    if ( isOuterEdge( x1 ) ) {
        if ( outboard ) {
            pushQuad( pos, uv, [ x1, y, z0 ], [ x1 + w, d, z0 ], [ x1 + w, d, z1 ], [ x1, y, z1 ], 'xz', [ h, w, 0 ] );
        } else {
            const i = x1 - w;
            pushQuad( pos, uv, [ i, y, z0 ], [ i, y, z1 ], [ x1, y, z1 ], [ x1, y, z0 ], 'xz', UP );
            pushQuad( pos, uv, [ x1, y, z0 ], [ x1, d, z0 ], [ x1, d, z1 ], [ x1, y, z1 ], 'zy', RIGHT );
        }
    }
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
    emitBoundary( pos, uv, { x0, x1, y: 0 }, z0, z1, w, h, isOutboard( variant ) );
    return packGeometry( pos, uv, variant === 'C' ? inwardFalloff( w ) : undefined );
}

/** Baked over the deck's own segment range rather than instanced from a moving Z-window: the strip is part
 *  of the slab's surface, so it is built the way the slab is built. */
function buildBoundaryGeometry( track: Track, w: number, h: number, variant: BoundaryVariant ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );
    const outboard = isOutboard( variant );

    for ( let i = 0; i < last; i++ ) {
        const seg = track.segmentAt( i );
        for ( const f of seg.floors ) emitBoundary( pos, uv, f, seg.z0, seg.z1, w, h, outboard );
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
