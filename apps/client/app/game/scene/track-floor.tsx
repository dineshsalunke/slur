import { CELL, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { AHEAD } from './track-instancing';
import { floorSurface } from './track-materials';
import { PANEL_L, PANEL_W } from './track-texture';

/**
 * Downward extrusion of the slab (world units). The sim never reads it — its floor is a plane at y=0.
 * Constrained from one side only: thickness must not conceal a gap from a low camera, so thicker reads
 * more solid but hides holes ("slab thickness must not conceal the gap at low camera height", handoff §5).
 */
export const SLAB_THICKNESS = 2;

type V3 = readonly [ number, number, number ];
/** Which world plane a face lies in, so its UVs come from the two axes that actually vary across it. */
type UvPlane = 'xz' | 'zy' | 'xy';

// Intended outward normals, one per face of the slab. Forward is +z.
const UP: V3 = [ 0, 1, 0 ];
const DOWN: V3 = [ 0, -1, 0 ];
const LEFT: V3 = [ -1, 0, 0 ];
const RIGHT: V3 = [ 1, 0, 0 ];
const FORWARD: V3 = [ 0, 0, 1 ];
const BACKWARD: V3 = [ 0, 0, -1 ];

/**
 * World position over PANEL size, so one tile = one panel and panel size stays a texture decision.
 * Sides and caps use the same scale, so their grain matches the top instead of stretching.
 */
function uvFor( p: V3, plane: UvPlane ): [ number, number ] {
    const [ x, y, z ] = p;
    if ( plane === 'xz' ) return [ x / PANEL_W, z / PANEL_L ];
    if ( plane === 'zy' ) return [ z / PANEL_L, y / PANEL_W ];
    return [ x / PANEL_W, y / PANEL_W ];
}

/**
 * Two triangles for a quad, wound so the face points along `normal`.
 *
 * Winding is computed from the intended normal, never hand-ordered: hand-ordering silently inverts faces,
 * and an inverted face disappears under backface culling with every gate still green.
 */
function pushQuad( pos: number[], uv: number[], a: V3, b: V3, c: V3, d: V3, plane: UvPlane, normal: V3 ): void {
    const ab: V3 = [ b[ 0 ] - a[ 0 ], b[ 1 ] - a[ 1 ], b[ 2 ] - a[ 2 ] ];
    const ac: V3 = [ c[ 0 ] - a[ 0 ], c[ 1 ] - a[ 1 ], c[ 2 ] - a[ 2 ] ];
    const cross: V3 = [
        ab[ 1 ] * ac[ 2 ] - ab[ 2 ] * ac[ 1 ],
        ab[ 2 ] * ac[ 0 ] - ab[ 0 ] * ac[ 2 ],
        ab[ 0 ] * ac[ 1 ] - ab[ 1 ] * ac[ 0 ],
    ];
    const dot = cross[ 0 ] * normal[ 0 ] + cross[ 1 ] * normal[ 1 ] + cross[ 2 ] * normal[ 2 ];
    const order = dot >= 0 ? [ a, b, c, a, c, d ] : [ a, d, c, a, c, b ];
    for ( const p of order ) {
        pos.push( p[ 0 ], p[ 1 ], p[ 2 ] );
        const [ u, v ] = uvFor( p, plane );
        uv.push( u, v );
    }
}

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
 */
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
    // The span's own height, not 0. Every span the generator emits today sits at y=0, but `FloorSpan.y`
    // is what the rails ride, so honouring it keeps a future raised platform correct by construction.
    const t = span.y;
    const b = span.y - SLAB_THICKNESS;

    // Top face — the surface you fly over, and the physics hull itself: what you see is what you hit.
    pushQuad( pos, uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'xz', UP );

    // Side walls — visible thickness, so a gap reads as a hole with depth, not a flat dark patch.
    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, t, z0 ], [ x0, t, z1 ], [ x0, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ x1, t, z0 ], [ x1, b, z0 ], [ x1, b, z1 ], [ x1, t, z1 ], 'zy', RIGHT );

    // End caps — the faces you look straight AT across a gap, and what gives it depth.
    if ( capFront ) pushQuad( pos, uv, [ x0, b, z0 ], [ x1, b, z0 ], [ x1, t, z0 ], [ x0, t, z0 ], 'xy', BACKWARD );
    if ( capBack ) pushQuad( pos, uv, [ x1, b, z1 ], [ x0, b, z1 ], [ x0, t, z1 ], [ x1, t, z1 ], 'xy', FORWARD );

    // Underside — seen when you fall into a gap, and it closes the solid against a low camera.
    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, b, z1 ], [ x1, b, z1 ], [ x1, b, z0 ], 'xz', DOWN );
}

function packGeometry( pos: number[], uv: number[] ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
    geo.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
    geo.computeVertexNormals();
    return geo;
}

/**
 * One capped slab span, for showing a slice of ribbon outside the game (the gallery).
 *
 * Not a `boxGeometry`: box UVs are normalised per face, which would stretch one tile across the whole
 * 64u width and show the gallery a finish the game never renders.
 */
export function buildSpanGeometry( x0: number, x1: number, z0: number, z1: number ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitSpan( pos, uv, { x0, x1, y: 0 }, z0, z1, true, true );
    return packGeometry( pos, uv );
}

/**
 * The whole ribbon as ONE geometry, from the sim's own `FloorSpan` data.
 *
 * One mesh rather than instanced tiles: tiles repeat every 4u, which is the dense seam grid the art
 * direction rejects. Spans rather than a lane grid: their 4u alignment is a generator artifact and not a
 * rule (GDD §0), so reading spans keeps the visual hull equal to the physics hull whatever it does later.
 */
function buildFloorGeometry( track: Track ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    // Past the finish line, not up to it: the leader-grace window is flown over the run-out pad, so
    // bounding the mesh at the line leaves it floorless. One render window covers the crossing.
    const last = Math.round( track.finishZ / SEG_LEN ) + Math.ceil( AHEAD / SEG_LEN );

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
            );
        }
    }

    return packGeometry( pos, uv );
}

/** The ribbon surface as a single generated mesh, with real thickness. Floor only — blocks and rails
 *  come from `TrackView`. */
export function TrackFloor( { track }: { track: Track } ) {
    // `resolveTrack` is pure, so a seed always yields identical geometry — built once, never per frame.
    // R3F owns a geometry passed via the `geometry` prop, so there is nothing to dispose by hand.
    const geo = useMemo( () => buildFloorGeometry( track ), [ track ] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial { ...floorSurface() } />
        </mesh>
    );
}
