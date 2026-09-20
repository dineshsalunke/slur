import { CELL, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { useDebugTuning } from '../../dev/debug-tuning';
import {
    BACKWARD,
    BOUNDARY_H,
    BOUNDARY_VARIANT,
    BOUNDARY_W,
    type BoundaryVariant,
    DOWN,
    FORWARD,
    isOutboard,
    isOuterEdge,
    LEFT,
    packGeometry,
    pushQuad,
    RIGHT,
    UP,
} from './track-geometry';
import { AHEAD } from './track-instancing';
import { FLOOR_EMISSIVE, FLOOR_EMISSIVE_INTENSITY, FLOOR_ENV_MAP_INTENSITY, floorSurface } from './track-materials';

/**
 * Downward extrusion of the slab (world units). The sim never reads it — its floor is a plane at y=0.
 * Constrained from one side only: thickness must not conceal a gap from a low camera, so thicker reads
 * more solid but hides holes ("slab thickness must not conceal the gap at low camera height", handoff §5).
 */
export const SLAB_THICKNESS = 2;

/**
 * True when `other` covers [x0,x1] at the SAME height, so the slab continues and needs no end cap.
 * Height is part of the test: two spans at different `y` are a step, and merging them eats its cap.
 */
function continues( other: Segment | null, x0: number, x1: number, y: number ): boolean {
    return other
        ? other.floors.some( ( f ) => f.x0 <= x0 + 1e-4 && f.x1 >= x1 - 1e-4 && Math.abs( f.y - y ) < 1e-4 )
        : false;
}

const isOffGrid = ( v: number ) => {
    const m = Math.abs( v % CELL );
    return m > 1e-4 && Math.abs( m - CELL ) > 1e-4;
};

/**
 * One floor span: top face, both side walls, and end caps only where the slab genuinely ends —
 * unconditional caps would bury coplanar back-to-back faces between adjacent spans and z-fight.
 *
 * At an outer edge the top face stops short and the side wall starts lower, leaving the corner for
 * `TrackBoundary`. This yields facets, not material, so the visual hull still equals the physics hull.
 */
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
    outboard: boolean,
): void {
    const { x0, x1 } = span;
    // The span's own height, not 0. Every span the generator emits today sits at y=0, but `FloorSpan.y`
    // is what the boundary rides, so honouring it keeps a future raised platform correct by construction.
    const t = span.y;
    const b = span.y - SLAB_THICKNESS;
    // Outboard (B) takes no deck: the top face runs the full span, and the wall moves out under the flare.
    const deckL = ! outboard && isOuterEdge( x0 ) ? x0 + w : x0;
    const deckR = ! outboard && isOuterEdge( x1 ) ? x1 - w : x1;
    const wallL = isOuterEdge( x0 ) ? t - h : t;
    const wallR = isOuterEdge( x1 ) ? t - h : t;
    const sideL = outboard && isOuterEdge( x0 ) ? x0 - w : x0;
    const sideR = outboard && isOuterEdge( x1 ) ? x1 + w : x1;

    // Top face — the surface you fly over, and the physics hull itself: what you see is what you hit.
    pushQuad( pos, uv, [ deckL, t, z0 ], [ deckL, t, z1 ], [ deckR, t, z1 ], [ deckR, t, z0 ], 'xz', UP );

    // Side walls — visible thickness, so a gap reads as a hole with depth, not a flat dark patch.
    pushQuad( pos, uv, [ sideL, b, z0 ], [ sideL, wallL, z0 ], [ sideL, wallL, z1 ], [ sideL, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ sideR, wallR, z0 ], [ sideR, b, z0 ], [ sideR, b, z1 ], [ sideR, wallR, z1 ], 'zy', RIGHT );

    // End caps — what you look straight AT across a gap. Squared: B's flare is not chamfered round an end.
    const capL = sideL;
    const capR = sideR;
    if ( capFront )
        pushQuad( pos, uv, [ capL, b, z0 ], [ capR, b, z0 ], [ capR, t, z0 ], [ capL, t, z0 ], 'xy', BACKWARD );
    if ( capBack )
        pushQuad( pos, uv, [ capR, b, z1 ], [ capL, b, z1 ], [ capL, t, z1 ], [ capR, t, z1 ], 'xy', FORWARD );

    // Underside — seen when you fall into a gap, and it closes the solid against a low camera.
    pushQuad( pos, uv, [ sideL, b, z0 ], [ sideL, b, z1 ], [ sideR, b, z1 ], [ sideR, b, z0 ], 'xz', DOWN );
}

/**
 * One capped slab span, for showing a slice of ribbon outside the game (the gallery).
 *
 * Not a `boxGeometry`: box UVs are normalised per face, which would stretch one tile across the whole
 * 64u width and show the gallery a finish the game never renders.
 */
export function buildSpanGeometry(
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
    emitSpan( pos, uv, { x0, x1, y: 0 }, z0, z1, true, true, w, h, isOutboard( variant ) );
    return packGeometry( pos, uv );
}

/** How many segments the generated meshes span: the whole track, plus the run-out pad past the finish
 *  line — the leader-grace window is flown over it, so bounding at the line leaves it floorless. */
export function segmentCount( track: Track ): number {
    return Math.round( track.finishZ / SEG_LEN ) + Math.ceil( AHEAD / SEG_LEN );
}

/**
 * The whole ribbon as ONE geometry, from the sim's own `FloorSpan` data.
 *
 * One mesh rather than instanced tiles: tiles repeat every 4u, which is the dense seam grid the art
 * direction rejects. Spans rather than a lane grid: their 4u alignment is a generator artifact and not a
 * rule (GDD §0), so reading spans keeps the visual hull equal to the physics hull whatever it does later.
 */
function buildFloorGeometry( track: Track, w: number, h: number, variant: BoundaryVariant ): THREE.BufferGeometry {
    const outboard = isOutboard( variant );
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );

    for ( let i = 0; i < last; i++ ) {
        const seg = track.segmentAt( i );
        const prev = i > 0 ? track.segmentAt( i - 1 ) : null;
        const next = i < last - 1 ? track.segmentAt( i + 1 ) : null;

        for ( const f of seg.floors ) {
            if ( import.meta.env.DEV && ( isOffGrid( f.x0 ) || isOffGrid( f.x1 ) ) ) {
                // Not an error — it still renders. But the art is authored to a 4u rhythm, so a generator
                // change that breaks alignment must be noticed rather than quietly absorbed.
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
                outboard,
            );
        }
    }

    return packGeometry( pos, uv );
}

/** The ribbon surface as a single generated mesh, with real thickness. Deck only — the boundary strip
 *  and the blocks come from `TrackView`. */
export function TrackFloor( { track }: { track: Track } ) {
    // The deck carves itself by the boundary's dimensions, so it rebuilds with the strip or the two desync.
    const tuning = useDebugTuning();
    const w = import.meta.env.DEV ? tuning.boundaryWidth : BOUNDARY_W;
    const h = import.meta.env.DEV ? tuning.boundaryWrap : BOUNDARY_H;
    const variant = import.meta.env.DEV ? tuning.boundaryVariant : BOUNDARY_VARIANT;
    const geo = useMemo( () => buildFloorGeometry( track, w, h, variant ), [ track, w, h, variant ] );

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial
                { ...floorSurface() }
                emissive={ import.meta.env.DEV ? tuning.floorEmissive : FLOOR_EMISSIVE }
                emissiveIntensity={ import.meta.env.DEV ? tuning.floorEmissiveIntensity : FLOOR_EMISSIVE_INTENSITY }
                envMapIntensity={ import.meta.env.DEV ? tuning.floorEnvMapIntensity : FLOOR_ENV_MAP_INTENSITY }
            />
        </mesh>
    );
}
