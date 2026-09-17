import { BLOCK_HEIGHT, CELL, HALF_WIDTH, SEG_LEN, tuningForShip } from '@slur/shared';
import type { ReactNode } from 'react';
import {
    DRAG_OPACITY_MAX,
    DRAG_SURFACE,
    FLOOR_SURFACE,
    LETHAL_SURFACE,
    RAIL_SURFACE,
} from '../../game/scene/track-materials';

/**
 * A gallery subject: one piece of art, isolated, at TRUE scale.
 *
 * `dims` is what the thing really measures in world units — the gallery prints it, because the entire
 * reason this route exists is that the concept boards were drawn 4–10× undersized
 * (`docs/ART_SCALE_REFERENCE.md`). A subject that renders at the wrong size here is worse than useless.
 */
export interface Subject {
    id: string;
    name: string;
    group: 'track' | 'obstacle' | 'structure';
    /** [width(x), height(y), depth(z)] in world units, or null when the subject has no fixed size. */
    dims: [ number, number, number ] | null;
    /** What a reviewer needs to know that the mesh alone does not say. */
    note: string;
    node: ReactNode;
}

// The Fighter's real footprint (2.6 × 2.52u) — used as the scale reference beside every subject. Read from
// the roster rather than hand-typed: hand-typing a ship width against the grid is precisely what produced
// the stale "Freighter 3.6u" bug the GDD §0 preamble exists to prevent.
const FIGHTER = tuningForShip( 'challenger' );
export const FIGHTER_W = FIGHTER.halfW * 2;
export const FIGHTER_L = FIGHTER.halfL * 2;

// One authoring lane wide — what today's generator emits. NOT a rule: GDD §0 is explicit that block
// width/depth are "a generation artifact, not a rule — any size is legal". Only the 8u HEIGHT is fixed.
const BLOCK_W = CELL;
const BLOCK_D = 8;

// A representative slice of ribbon rather than the full 8000u, so the slab is inspectable at a sane camera
// distance. Full width (64u) is kept — the width is the whole point.
const SLAB_LEN = SEG_LEN;
const RAIL_W = 0.6;
const RAIL_H = 0.35;

export const SUBJECTS: readonly Subject[] = [
    {
        id: 'floor',
        name: 'Track slab',
        group: 'track',
        dims: [ 2 * HALF_WIDTH, 0.5, SLAB_LEN ],
        note: 'Full 64u width, one 20u segment deep. The ship is 2.6u — about 1/24th of this. Near-black by design: the neon lives on the rails, not the surface.',
        node: (
            <mesh>
                <boxGeometry args={ [ 2 * HALF_WIDTH, 0.5, SLAB_LEN ] } />
                <meshStandardMaterial { ...FLOOR_SURFACE } />
            </mesh>
        ),
    },
    {
        id: 'rail',
        name: 'Edge rail',
        group: 'track',
        dims: [ RAIL_W, RAIL_H, SLAB_LEN ],
        note: 'The bright grid-line read. In game these sit at x = ±32u, i.e. over 12 ship-widths from a pilot in the middle — which is ADD §10 OQ6, the open question about whether edge glow can carry navigation at true scale.',
        node: (
            <mesh>
                <boxGeometry args={ [ RAIL_W, RAIL_H, SLAB_LEN ] } />
                <meshStandardMaterial { ...RAIL_SURFACE } />
            </mesh>
        ),
    },
    {
        id: 'lethal',
        name: 'Deadly block',
        group: 'obstacle',
        dims: [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ],
        note: 'Height 8u is FIXED and load-bearing — above double-jump reach, so you strafe around, never hop. Width and depth are free; 4×8u is only what the generator emits today.',
        node: (
            <mesh>
                <boxGeometry args={ [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ] } />
                <meshStandardMaterial { ...LETHAL_SURFACE } />
            </mesh>
        ),
    },
    {
        id: 'drag',
        name: 'Slow / drag block',
        group: 'obstacle',
        dims: [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ],
        note: 'Passable: fly through for a speed hit. Translucent + amber so it reads "slow, not death" against the opaque red. ADR-009 (PROPOSED) would merge this with destructible blocks into one breakable primitive.',
        node: (
            <mesh>
                <boxGeometry args={ [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ] } />
                <meshStandardMaterial { ...DRAG_SURFACE } opacity={ DRAG_OPACITY_MAX } />
            </mesh>
        ),
    },
    {
        id: 'readability',
        name: 'Deadly vs slow — side by side',
        group: 'obstacle',
        dims: null,
        note: 'THE readability gate (ADD §10 OQ7 / ADR-009). Under one energy colour these must be told apart by silhouette and material alone, in roughly half a second at 55 u/s. If you cannot separate them here, at rest, they will not separate at speed.',
        node: (
            <group>
                <mesh position={ [ -BLOCK_W * 1.2, 0, 0 ] }>
                    <boxGeometry args={ [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ] } />
                    <meshStandardMaterial { ...LETHAL_SURFACE } />
                </mesh>
                <mesh position={ [ BLOCK_W * 1.2, 0, 0 ] }>
                    <boxGeometry args={ [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ] } />
                    <meshStandardMaterial { ...DRAG_SURFACE } opacity={ DRAG_OPACITY_MAX } />
                </mesh>
            </group>
        ),
    },
    {
        id: 'corridor',
        name: 'Minimum corridor (7u)',
        group: 'track',
        dims: [ 7, BLOCK_HEIGHT, BLOCK_D ],
        note: 'MIN_CLEAR — the one hard spatial invariant (GDD §0). Two deadly blocks with the narrowest legal gap between them. Art must never depict a survivable route tighter than this.',
        node: (
            <group>
                <mesh position={ [ -( 7 / 2 + BLOCK_W / 2 ), 0, 0 ] }>
                    <boxGeometry args={ [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ] } />
                    <meshStandardMaterial { ...LETHAL_SURFACE } />
                </mesh>
                <mesh position={ [ 7 / 2 + BLOCK_W / 2, 0, 0 ] }>
                    <boxGeometry args={ [ BLOCK_W, BLOCK_HEIGHT, BLOCK_D ] } />
                    <meshStandardMaterial { ...LETHAL_SURFACE } />
                </mesh>
            </group>
        ),
    },
];
