import { BLOCK_HEIGHT } from '@slur/shared';

export interface BlockFootprint {
    /** FREE axis — any real-valued width is legal. */
    readonly width: number;
    /** FREE axis. */
    readonly depth: number;
}

/**
 * Three legal footprints — **TEST CASES, NOT A SPEC.**
 *
 * Width and depth are the generator's output, not the art's, so the real acceptance is that the material
 * holds across the continuous range the generator emits. These three are picked to span it: a square-in-plan
 * chunk, a narrow pillar, and a deep slab. The first two are `docs/ART_SCALE_REFERENCE.md` §2's own
 * stated-legal examples (5.5 × 5.5 × 8 and 3.5 × 5 × 8); the third is what the generator emits today, which
 * that same section calls "a generation artifact, not a rule".
 *
 * Height is absent on purpose: it is never a variable. See `BLOCK_HEIGHT`.
 *
 * ⚠ BOARD 10 PANEL 3 IS HALF SPEC AND HALF POISON, and nothing on the board marks the difference. Its
 * STANDARD (DEADLY) row reads CUBE (1×1) · WIDE (2×1 / 3×1) · TALL (1×2) · STACK / GROUP. The first two are
 * exactly this — width/depth variation. **TALL and STACK vary the one axis that must never vary** and are not
 * buildable. Take the aspect-ratio idea from that row; take nothing else.
 */
export const BLOCK_FOOTPRINTS: readonly BlockFootprint[] = [
    { width: 5.5, depth: 5.5 },
    { width: 3.5, depth: 5 },
    { width: 4, depth: 8 },
];

/** Clear air between neighbouring blocks in the lab, so three footprints read as a set and not as a wall. */
export const FAMILY_GAP = 3;

export interface PlacedBlock extends BlockFootprint {
    /** World x of the block's centre. */
    readonly x: number;
}

/**
 * Lay footprints out along x, centred on the origin, separated by `gap` of clear air.
 *
 * A pure function so the layout is testable without a renderer — the lab's framing is derived from the span
 * it returns, and a wrong span quietly crops the subject rather than failing.
 */
export function layOutFamily(
    footprints: readonly BlockFootprint[],
    gap: number,
): { blocks: readonly PlacedBlock[]; span: number } {
    const total = footprints.reduce( ( sum, f ) => sum + f.width, 0 );
    const span = total + gap * Math.max( 0, footprints.length - 1 );

    let cursor = -span / 2;
    const blocks = footprints.map( ( f ) => {
        const x = cursor + f.width / 2;
        cursor += f.width + gap;
        return { ...f, x };
    } );

    return { blocks, span };
}

export const BLOCK_FAMILY = layOutFamily( BLOCK_FOOTPRINTS, FAMILY_GAP );

/** Re-exported so the component and its test read the height from one place. */
export { BLOCK_HEIGHT };
