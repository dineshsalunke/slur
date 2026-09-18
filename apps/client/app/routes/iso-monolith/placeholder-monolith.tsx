import { Fragment } from 'react';
import { RAIL_SURFACE } from '../../game/scene/track-materials';

/**
 * PLACEHOLDER ONLY — two slabs at plausible monolith scale.
 *
 * This is NOT a monolith design. It exists to prove the `/iso-*` instrument end to end with something whose
 * size is defensible: `docs/ART_SCALE_REFERENCE.md` §5 puts an obelisk at 200–400u (3–6 track widths) and a
 * gate at 200–350u, and board 03 is one of only two boards drawn against a correct 2.6u ship, so it is safe
 * to compare against. The monolith LANE owns everything about how these should actually look; whoever picks
 * that up should delete this file outright rather than evolve it.
 *
 * Material is `RAIL_SURFACE` from `track-materials.ts` — imported, never re-declared, so the placeholder sits
 * in the same emissive register as the shipped track instead of inventing a look nobody agreed to.
 */
const OBELISK = { w: 26, h: 300, d: 26 };
const SLAB = { w: 60, h: 140, d: 14 };

export function PlaceholderMonolith() {
    return (
        <Fragment>
            <mesh position={ [ 0, OBELISK.h / 2, 0 ] }>
                <boxGeometry args={ [ OBELISK.w, OBELISK.h, OBELISK.d ] } />
                <meshStandardMaterial { ...RAIL_SURFACE } />
            </mesh>

            <mesh position={ [ 90, SLAB.h / 2, -40 ] }>
                <boxGeometry args={ [ SLAB.w, SLAB.h, SLAB.d ] } />
                <meshStandardMaterial { ...RAIL_SURFACE } />
            </mesh>
        </Fragment>
    );
}
