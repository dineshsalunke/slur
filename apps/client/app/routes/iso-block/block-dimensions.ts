import { BLOCK_HEIGHT } from '@slur/shared';

/**
 * The placeholder block's box. Separate from the component so the dimension gate beside it can run on the
 * cheap node runtime without pulling React in.
 *
 * WIDTH AND DEPTH ARE PLACEHOLDER VALUES, NOT A DESIGN. They are what today's generator happens to emit —
 * `docs/ART_SCALE_REFERENCE.md` §2 calls the 4u × 8u footprint "a generation artifact, not a rule". The
 * silhouette family that replaces them is this lane's actual output.
 */
export const PLACEHOLDER_BLOCK = {
    /** FREE axis — any real-valued width is legal. */
    width: 4,
    /** FIXED, load-bearing: above double-jump reach on purpose → un-jumpable. Never vary this. */
    height: BLOCK_HEIGHT,
    /** FREE axis. */
    depth: 8,
} as const;
