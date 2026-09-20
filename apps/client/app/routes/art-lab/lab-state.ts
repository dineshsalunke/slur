// Per-frame lab knobs, held as MODULE SINGLETONS — never React state.
//
// MECHANISM (non-negotiable #14 — alternatives weighed): the rig reads these inside `useFrame`, 60×/sec.
// Candidates considered: React state + props (re-renders the Canvas subtree on every toggle — rejected,
// non-negotiable #4), context (same re-render cost), a koota trait (works, but these are UI chrome and own
// no entity), a ref threaded through props (prop-drilling, rejected by non-negotiable #10), and this —
// a module singleton the loop READS each frame. Chosen because it is the pattern already established for
// exactly this job in `game/spectator.ts` (`runPhase`/`localRole`), which `net-loop.tsx` reads per frame
// for the same reason: a control value that changes on human input but is CONSUMED per-frame must not be
// a subscription.
//
// STRUCTURAL knobs (seed, env variant, bloom on/off) are deliberately NOT here — those are real props of
// the scene graph, change rarely, and SHOULD re-render. They live as React state in the route module.

export const labControls = {
    /** Freeze the sim. The ship holds its pose; the camera still eases, so you can study a frozen field. */
    paused: false,
    /**
     * Ghost mode: advance z at a fixed rate with NO collision and NO physics, so you can inspect art
     * without dying. Off = the real shared `simulate()` with real collision — which is what a feel test
     * needs. Deliberately defaults OFF: this lab exists to answer "how does it read at speed", and a
     * ghost that cannot die cannot answer that.
     */
    ghost: false,
    /** Ghost-mode forward speed (u/s). Roughly Fighter cruise so the art reads at a representative rate. */
    ghostSpeed: 55,
};

/**
 * One-shot commands, drained by the rig on the next frame. A command is `null` when there is nothing
 * pending. Using a drained slot rather than a callback keeps the DOM controls free of any frame coupling.
 */
import type { ShipId } from '@slur/shared';

export const labCommands = {
    /** Teleport the ship to this world-z, zeroing velocity. Drained to null once applied. */
    jumpToZ: null as number | null,
    setShip: null as ShipId | null,
};
