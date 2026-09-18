import { CELL, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { FLOOR_SURFACE } from './track-materials';
import { PANEL_L, PANEL_W, trackSurfaceTexture } from './track-texture';

/**
 * Downward extrusion of the slab (world units). Purely an art choice — `SLAB_THICKNESS` is NOT a game
 * constant. The sim's floor is a plane at y=0 and collision never reads this (the art-direction handoff §3
 * confirms: "Track slab thickness | Art/implementation choice").
 *
 * It IS load-bearing for readability though: the handoff §5 warns that "slab thickness must not conceal the gap at
 * low camera height". Thicker reads more solid but hides holes from a low camera — tune against both.
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
 * UVs are world position divided by the PANEL size, so one texture tile = one panel. Because the mesh is
 * continuous, panels tile seamlessly across the whole ribbon and panel size stays a texture decision.
 * Side faces and caps use the same scale so grain density matches the top rather than stretching.
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
 * Winding is COMPUTED, not reasoned about. Getting it by hand means predicting how a world-space corner
 * order projects to screen space, and the axis handedness flips depending on which way the face looks —
 * I got the top face wrong exactly that way (the whole ribbon vanished under backface culling), then got
 * the end caps wrong the same way a second time. Taking the cross product and flipping when it disagrees
 * with the intended normal makes every face correct by construction.
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
    pushQuad( pos, uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'xz', UP );

    // Side walls — visible thickness, so a gap reads as a hole with depth rather than a flat dark patch.
    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, t, z0 ], [ x0, t, z1 ], [ x0, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ x1, t, z0 ], [ x1, b, z0 ], [ x1, b, z1 ], [ x1, t, z1 ], 'zy', RIGHT );

    // End caps — the faces you look straight AT across a gap. These were invisible before the winding was
    // computed rather than guessed, which is why gaps read as flat holes with no depth.
    if ( capFront ) pushQuad( pos, uv, [ x0, b, z0 ], [ x1, b, z0 ], [ x1, t, z0 ], [ x0, t, z0 ], 'xy', BACKWARD );
    if ( capBack ) pushQuad( pos, uv, [ x1, b, z1 ], [ x0, b, z1 ], [ x0, t, z1 ], [ x1, t, z1 ], 'xy', FORWARD );

    // Underside — visible from below when you fall into a gap, and it closes the solid so the slab never
    // shows a hollow interior from a low camera.
    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, b, z1 ], [ x1, b, z1 ], [ x1, b, z0 ], 'xz', DOWN );
}

/**
 * Builds the whole ribbon as ONE geometry, generated from the sim's real `FloorSpan` data.
 *
 * WHY GENERATED, NOT INSTANCED TILES: tiles repeat every 4u in both axes — a visible grid, and exactly the
 * "dense seam grid" the art-direction handoff §5 rejects. One mesh gives continuous UVs, so panel size becomes a
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
    const map = trackSurfaceTexture();

    return (
        <mesh geometry={ geo }>
            { /* Keeps `FLOOR_SURFACE`'s emissive whisper (shared with `TrackView`) but deliberately
                 OVERRIDES two of its values:
                 · `color` → white. `FLOOR_SURFACE.color` is `#050507`, and base colour MULTIPLIES the map —
                   at that value the texture was crushed to flat black and no grain or panel was visible.
                   The texture already carries its own near-black base, so white lets it read as authored.
                 · `metalness` → low. A metallic surface gets its value from REFLECTIONS, and this scene has
                   ambient light and no environment map, so high metalness just renders black. v2's
                   "restrained gloss / warm reflections" needs the marigold edge (and probably an env map)
                   to reflect BEFORE metalness is worth raising — until then it only removes information. */ }
            <meshStandardMaterial
                { ...FLOOR_SURFACE }
                color="#ffffff"
                map={ map }
                roughness={ 0.62 }
                metalness={ 0.12 }
            />
        </mesh>
    );
}
