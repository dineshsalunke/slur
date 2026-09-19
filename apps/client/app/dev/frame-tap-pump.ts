/**
 * The pump itself, as a pure function over injected dependencies — no React, no R3F imports, no `window`.
 * Split out from `frame-tap.tsx` for exactly one reason: this is the part whose ORDER is load-bearing and
 * whose failure would be silent, so it has to be testable without a GPU.
 *
 * WHY `advance()` AND NOT `gl.render( scene, camera )`. The workaround the art lanes survived on was
 * `gl.render` + `readPixels`, which does work with rAF dead — but it draws the raw scene straight to the
 * default framebuffer, bypassing `EffectComposer` entirely. There is no bloom in that frame, and bloom is the
 * most load-bearing thing in this art direction; it also bypasses every `useFrame` subscriber, so the sim,
 * the rig and the chase camera never advance and you photograph one frozen pose over and over.
 *
 * `advance()` runs fiber's real `update()`: every `useFrame` subscriber in priority order, then the render.
 * And the interlock that makes this the REAL post-processed frame is provable from the installed source
 * rather than from observation:
 *
 *   - `@react-three/postprocessing` 3.0.4 mounts its composer as `useFrame( …, enabled ? renderPriority : 0 )`
 *     with `renderPriority` defaulting to 1.
 *   - `@react-three/fiber` 9.7.0 ends `update()` with `if (!state.internal.priority && state.gl.render)
 *     state.gl.render(...)`, and `internal.priority` counts subscribers with priority > 0.
 *
 * So whenever an `EffectComposer` is mounted, R3F SUPPRESSES its own render and the composer becomes the
 * renderer. Driving the frameloop drives bloom. `frame-tap-interlock.test.ts` pins both halves of that.
 *
 * CAPTURING IN THE SAME SYNCHRONOUS TURN IS MANDATORY. Neither Canvas passes a `gl` prop, so three.js leaves
 * `preserveDrawingBuffer` false and the drawing buffer is cleared once the frame is presented. `advance()` is
 * synchronous, so `advance(); capture()` in one task reads a live buffer and needs no `gl` prop change —
 * which matters, because turning `preserveDrawingBuffer` on would be a real cost to every visible tab, i.e.
 * the instrument degrading the thing it measures.
 */

// Generic in the root-state type rather than taking `unknown`: fiber's own `advance` is declared over its
// concrete `RootState`, and a parameter typed `unknown` is contravariantly incompatible with that, so
// `unknown` would force a cast at the one call site where the real types line up perfectly.
export type AdvanceFn< S > = ( timestamp: number, runGlobalEffects?: boolean, state?: S ) => void;

/** The structural slice of R3F's `RootState` the pump touches. Structural so a test can fake it. */
export type PumpRootState = {
    gl: {
        domElement: { toDataURL( type: string ): string };
        render( scene: unknown, camera: unknown ): void;
    };
    scene: unknown;
    camera: unknown;
};

/**
 * Filled by a priority-0 `useFrame` in `<FrameTap/>`, so the deltas reported are the ones subscribers
 * actually received rather than ones the pump inferred about itself.
 */
export type DeltaLog = { first: number; last: number; frames: number };

export function resetLog( log: DeltaLog ): void {
    log.first = 0;
    log.last = 0;
    log.frames = 0;
}

export function recordDelta( log: DeltaLog, delta: number ): void {
    if ( log.frames === 0 ) log.first = delta;
    log.last = delta;
    log.frames += 1;
}

export type TapResult = {
    composed: string;
    bloomOff: string | null;
    firstDelta: number;
    capturedDelta: number;
    pumped: number;
};

export function pumpAndCapture< S extends PumpRootState >( {
    advance,
    getState,
    log,
    now,
    warmup,
    frames,
    ab,
}: {
    advance: AdvanceFn< S >;
    getState: () => S;
    log: DeltaLog;
    now: () => number;
    warmup: number;
    frames: number;
    ab: boolean;
} ): TapResult {
    const warm = Math.max( 0, Math.round( warmup ) );
    const keep = Math.max( 1, Math.round( frames ) );
    const total = warm + keep;

    resetLog( log );
    for ( let i = 0; i < total; i++ ) {
        // Pass the root state explicitly so only THIS root advances. `advance()` with no state walks every
        // root in `_roots`, which on a page with a second Canvas would step a scene nobody asked about.
        // Timestamp in ms, matching what fiber's own rAF `loop()` hands to global effects.
        advance( now(), true, getState() );
    }

    const state = getState();
    // The composed (post-processed) frame FIRST. The A/B re-render below overwrites the framebuffer, so
    // reversing these two lines would silently return a bloom-off image as the composed frame — which is the
    // exact failure the instrument exists to make impossible. Pinned in the test.
    const composed = state.gl.domElement.toDataURL( 'image/png' );

    let bloomOff: string | null = null;
    if ( ab ) {
        // Deliberately the bypass: a raw scene draw over the same framebuffer, skipping the composer. Its
        // only job is to DISAGREE with `composed` — that disagreement is the evidence the pump really went
        // through bloom. Off by default: it doubles the work per tap to re-prove a property a test guards.
        state.gl.render( state.scene, state.camera );
        bloomOff = state.gl.domElement.toDataURL( 'image/png' );
    }

    return { composed, bloomOff, firstDelta: log.first, capturedDelta: log.last, pumped: total };
}
