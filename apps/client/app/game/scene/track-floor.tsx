import { CELL, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { FLOOR_SURFACE } from './track-materials';

/**
 * Downward extrusion of the slab (world units). Purely an art choice — `SLAB_THICKNESS` is NOT a game
 * constant. The sim's floor is a plane at y=0 and collision never reads this (`art-handoff-v2` §3 confirms:
 * "Track slab thickness | Art/implementation choice").
 *
 * It IS load-bearing for readability though: v2 §5 warns that "slab thickness must not conceal the gap at
 * low camera height". Thicker reads more solid but hides holes from a low camera — tune against both.
 */
export const SLAB_THICKNESS = 2;

/**
 * World units per texture tile. `CELL` (4u) repeats the surface texture once per authoring cell. Panels
 * come from the TEXTURE, not geometry — which is the whole reason this is one continuous mesh rather than
 * instanced tiles (a 4u tile grid repeats visibly every 4u and fights v2's "clean large panels, sparse
 * seams").
 */
const UV_SCALE = CELL;

type V3 = readonly [ number, number, number ];
/** Which world plane a face lies in, so its UVs come from the two axes that actually vary across it. */
type UvPlane = 'xz' | 'zy' | 'xy';

function uvFor( p: V3, plane: UvPlane ): [ number, number ] {
    const [ x, y, z ] = p;
    if ( plane === 'xz' ) return [ x / UV_SCALE, z / UV_SCALE ];
    if ( plane === 'zy' ) return [ z / UV_SCALE, y / UV_SCALE ];
    return [ x / UV_SCALE, y / UV_SCALE ];
}

/** Two triangles for a quad. Corners must be given counter-clockwise from the front, so default winding
 *  yields outward normals and `computeVertexNormals` needs no correction pass. */
function pushQuad( pos: number[], uv: number[], a: V3, b: V3, c: V3, d: V3, plane: UvPlane ): void {
    for ( const p of [ a, b, c, a, c, d ] ) {
        pos.push( p[ 0 ], p[ 1 ], p[ 2 ] );
        const [ u, v ] = uvFor( p, plane );
        uv.push( u, v );
    }
}

/** True when `other` has a floor span covering [x0,x1] — the slab continues, so no end cap is needed. */
function continues( other: Segment | null, x0: number, x1: number ): boolean {
    return other ? other.floors.some( ( f ) => f.x0 <= x0 + 1e-4 && f.x1 >= x1 - 1e-4 ) : false;
}

const isOffGrid = ( v: number ) => {
    const m = Math.abs( v % CELL );
    return m > 1e-4 && Math.abs( m - CELL ) > 1e-4;
};

/**
 * One floor span: top face, both side walls, and end caps only where the slab genuinely ends.
 *
 * Caps are conditional rather than unconditional because two adjacent segments with the same span would
 * otherwise bury coplanar back-to-back faces inside the solid and z-fight.
 */
function emitSpan(
    pos: number[],
    uv: number[],
    span: { x0: number; x1: number },
    z0: number,
    z1: number,
    capFront: boolean,
    capBack: boolean,
): void {
    const { x0, x1 } = span;
    const t = 0;
    const b = -SLAB_THICKNESS;

    // Top face — the surface you fly over. This IS the physics hull (ADR-002, WYSIWYG).
    // Wound x0→z1 first: viewed from ABOVE (-y look direction) the x/z axes form a left-handed screen
    // basis, so the "obvious" x0,x1,z1,z0 order produces a downward-facing front face and the whole
    // ribbon vanishes under backface culling. Verified in-browser, not reasoned about.
    pushQuad( pos, uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'xz' );

    // Side walls — visible thickness, so a gap reads as a hole with depth rather than a flat dark patch.
    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, t, z0 ], [ x0, t, z1 ], [ x0, b, z1 ], 'zy' );
    pushQuad( pos, uv, [ x1, t, z0 ], [ x1, b, z0 ], [ x1, b, z1 ], [ x1, t, z1 ], 'zy' );

    if ( capFront ) pushQuad( pos, uv, [ x0, b, z0 ], [ x1, b, z0 ], [ x1, t, z0 ], [ x0, t, z0 ], 'xy' );
    if ( capBack ) pushQuad( pos, uv, [ x1, b, z1 ], [ x0, b, z1 ], [ x0, t, z1 ], [ x1, t, z1 ], 'xy' );
}

/**
 * Builds the whole ribbon as ONE geometry, generated from the sim's real `FloorSpan` data.
 *
 * WHY GENERATED, NOT INSTANCED TILES: tiles repeat every 4u in both axes — a visible grid, and exactly the
 * "dense seam grid" `art-handoff-v2` §5 rejects. One mesh gives continuous UVs, so panel size becomes a
 * texture decision instead of a geometry constraint.
 *
 * WHY FROM `FloorSpan` AND NOT A LANE GRID: spans happen to be 4u-aligned today
 * (`x0 = -HALF_WIDTH + n*CELL`), so a lane grid would match — but GDD §0 is explicit that this is a
 * generation artifact, not a rule. Reading spans directly keeps WYSIWYG true whatever the generator does
 * later; the dev warning below makes a future divergence loud rather than silent.
 */
function buildFloorGeometry( track: Track ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const length = Math.round( track.finishZ / SEG_LEN );

    for ( let i = 0; i < length; i++ ) {
        const seg = track.segmentAt( i );
        const prev = i > 0 ? track.segmentAt( i - 1 ) : null;
        const next = i < length - 1 ? track.segmentAt( i + 1 ) : null;

        for ( const f of seg.floors ) {
            if ( import.meta.env.DEV && ( isOffGrid( f.x0 ) || isOffGrid( f.x1 ) ) ) {
                // Not an error — a non-aligned span still renders correctly. But the ART is authored to a 4u
                // rhythm (panel texture, edge-piece placement), so a generator change that breaks alignment
                // needs to be noticed rather than quietly absorbed.
                console.warn( `[track-floor] seg ${ i } span not CELL-aligned: ${ f.x0 }..${ f.x1 }` );
            }
            emitSpan( pos, uv, f, seg.z0, seg.z1, ! continues( prev, f.x0, f.x1 ), ! continues( next, f.x0, f.x1 ) );
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
    geo.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
    geo.computeVertexNormals();
    return geo;
}

/**
 * The ribbon surface as a single generated mesh, with real thickness.
 *
 * Scope: the FLOOR only. Blocks and edge rails still come from `TrackView`. Nothing in the game uses this
 * yet — it is mounted behind the `slab` toggle in `/art-lab` so it can be compared against the current
 * instanced floor before replacing it.
 */
export function TrackFloor( { track }: { track: Track } ) {
    // Built once per track. `resolveTrack` is pure, so a given seed always yields identical geometry and
    // there is nothing to rebuild per frame. R3F disposes a geometry passed via the `geometry` prop when
    // the mesh unmounts, so this needs no manual teardown.
    const geo = useMemo( () => buildFloorGeometry( track ), [ track ] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial { ...FLOOR_SURFACE } />
        </mesh>
    );
}
