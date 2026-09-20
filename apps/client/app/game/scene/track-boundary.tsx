import type { Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { useDebugTuning } from '../../dev/debug-tuning';
import { segmentCount } from './track-floor';
import { BOUNDARY_H, BOUNDARY_W, isOuterEdge, packGeometry, pushQuad, type UvPlane } from './track-geometry';
import { BOUNDARY_SURFACE, MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

/**
 * NOT a rail: board 24 panel 02 excludes "raised rails or ornamental edge machinery", so the strip IS the
 * slab's top outer corner, carrying M7 where the deck carries M1. It follows the SPAN, not the track.
 * A BEVEL, not flat-top-plus-vertical-drop: a face on the outer plane points away and was always culled.
 */
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
    const d = y - h;
    const plane: UvPlane = w >= h ? 'xz' : 'zy';

    if ( isOuterEdge( x0 ) ) {
        const i = x0 + w;
        pushQuad( pos, uv, [ x0, d, z0 ], [ x0, d, z1 ], [ i, y, z1 ], [ i, y, z0 ], plane, [ -h, w, 0 ] );
    }
    if ( isOuterEdge( x1 ) ) {
        const i = x1 - w;
        pushQuad( pos, uv, [ i, y, z0 ], [ i, y, z1 ], [ x1, d, z1 ], [ x1, d, z0 ], plane, [ h, w, 0 ] );
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
): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitBoundary( pos, uv, { x0, x1, y: 0 }, z0, z1, w, h );
    return packGeometry( pos, uv );
}

/** Baked over the deck's own segment range rather than instanced from a moving Z-window: the strip is part
 *  of the slab's surface, so it is built the way the slab is built. */
function buildBoundaryGeometry( track: Track, w: number, h: number ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );

    for ( let i = 0; i < last; i++ ) {
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
