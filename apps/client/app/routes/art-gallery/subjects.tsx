import { BLOCK_HEIGHT, CELL, HALF_WIDTH, SEG_LEN, tuningForShip } from '@slur/shared';
import type { ReactNode } from 'react';
import { SLAB_THICKNESS } from '../../game/scene/track-floor';
import { BOUNDARY_H, BOUNDARY_W } from '../../game/scene/track-geometry';
import { DRAG_OPACITY_MAX, DRAG_SURFACE, LETHAL_SURFACE } from '../../game/scene/track-materials';
import { BoundarySubject } from './boundary-subject';
import { TrackSlabSubject } from './track-slab-subject';

export interface Subject {
    id: string;
    name: string;
    group: 'track' | 'obstacle' | 'structure';
    dims: [ number, number, number ] | null;
    note: string;
    node: ReactNode;
}

const FIGHTER = tuningForShip( 'challenger' );
export const FIGHTER_W = FIGHTER.halfW * 2;
export const FIGHTER_L = FIGHTER.halfL * 2;
export const FIGHTER_H = 1.2;

const BLOCK_W = CELL;
const BLOCK_D = 8;

const SLAB_LEN = SEG_LEN;

export const PITCH = 90;
const COLS = 3;

export function slotFor( i: number ): [ number, number, number ] {
    const col = i % COLS;
    const row = Math.floor( i / COLS );
    return [ ( col - ( COLS - 1 ) / 2 ) * PITCH, 0, row * PITCH ];
}

export const SUBJECTS: readonly Subject[] = [
    {
        id: 'floor',
        name: 'Track slab',
        group: 'track',
        dims: [ 2 * HALF_WIDTH, SLAB_THICKNESS, SLAB_LEN ],
        note: 'Full 64u width, one 20u segment deep, at the real slab thickness. The ship is 2.6u — about 1/24th of this. Near-black by design: the energy lives at the boundary, not on the surface.',
        node: <TrackSlabSubject />,
    },
    {
        id: 'boundary',
        name: 'Outer boundary',
        group: 'track',
        dims: [ BOUNDARY_W, BOUNDARY_H, SLAB_LEN ],
        note: "The emitter strip, embedded in the deck's top outer corner and wrapping it — board 24 panel 02 excludes a raised rail. `dims` is the strip itself; the 8u of deck beside it is context. In game these sit at x = ±32u, over 12 ship-widths from a pilot in the middle, which is ADD §10 OQ6: whether edge glow can carry navigation at true scale.",
        node: <BoundarySubject />,
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
