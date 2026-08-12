import { describe, expect, it } from 'vitest';
import { THREAT_Z, threatTick, VIGNETTE_FALLOFF, VIGNETTE_MAX, VIGNETTE_RAMP_Z, vignetteOpacity } from './threat-hud';

// The vignette's opacity is the ONLY gameplay-visible mapping (proximity → danger read), so it's the thing worth
// pinning. These are differential — monotonicity, clamps, and the cap — NOT hardcoded pixels or alphas, which are
// feel-gate tunables. Every boundary is DERIVED from the exported constants, so a pure retune (THREAT_Z 70→90,
// VIGNETTE_MAX 0.42→0.55, a shorter ramp, a non-linear falloff) does NOT redden the suite — only a change to the
// mapping's SHAPE does.
describe( 'vignetteOpacity', () => {
    it( 'is 0 when there is no threat (bestDz = +Infinity)', () => {
        expect( vignetteOpacity( Number.POSITIVE_INFINITY ) ).toBe( 0 );
    } );

    it( 'is 0 once a bolt reaches the end of the ramp', () => {
        expect( vignetteOpacity( VIGNETTE_RAMP_Z ) ).toBe( 0 );
    } );

    it( 'stays 0 beyond the ramp rather than going negative', () => {
        expect( vignetteOpacity( VIGNETTE_RAMP_Z * 2 ) ).toBe( 0 );
    } );

    it( 'grows strictly as the bolt closes in', () => {
        // Closer (smaller bestDz) → stronger. Proves the proximity is actually wired, not a constant. Sample
        // points are fractions of the ramp so they track it rather than pinning literals.
        expect( vignetteOpacity( 0 ) ).toBeGreaterThan( vignetteOpacity( VIGNETTE_RAMP_Z / 2 ) );
        expect( vignetteOpacity( VIGNETTE_RAMP_Z / 2 ) ).toBeGreaterThan( vignetteOpacity( VIGNETTE_RAMP_Z - 1 ) );
        expect( vignetteOpacity( VIGNETTE_RAMP_Z - 1 ) ).toBeGreaterThan( 0 );
    } );

    it( 'saturates at the peak for a level / just-overtaken bolt (clamps negatives)', () => {
        expect( vignetteOpacity( -2 ) ).toBe( vignetteOpacity( 0 ) );
    } );

    it( 'peaks exactly at the VIGNETTE_MAX cap, never above (stays subtle)', () => {
        expect( vignetteOpacity( 0 ) ).toBe( VIGNETTE_MAX );
    } );

    // The ramp is its own knob so the #11 gate can retune the vignette's reach WITHOUT moving the range at which
    // the tick appears. This pins the decoupling itself, not either value.
    it( 'ramps over VIGNETTE_RAMP_Z, independently of the THREAT_Z detection range', () => {
        expect( vignetteOpacity( VIGNETTE_RAMP_Z / 2 ) ).toBeCloseTo( 0.5 ** VIGNETTE_FALLOFF * VIGNETTE_MAX, 10 );
    } );
} );

// world +x renders screen-LEFT, so a bolt at dx>0 must point ◀ (left). This mapping is a real invariant — a
// flipped sign points the pilot the wrong way — so the direction glyphs are pinned with literals.
describe( 'threatTick', () => {
    it( 'is null when there is no threat', () => {
        expect( threatTick( null ) ).toBeNull();
    } );

    it( 'points ◀ (screen-left) for a bolt at positive dx', () => {
        expect( threatTick( 5 ) ).toBe( '◀ ⚠' );
    } );

    it( 'points ▶ (screen-right) for a bolt at negative dx', () => {
        expect( threatTick( -5 ) ).toBe( '⚠ ▶' );
    } );

    it( 'shows a plain warning for a dead-astern bolt (|dx| within CENTER_X)', () => {
        expect( threatTick( 1 ) ).toBe( '⚠' );
    } );
} );

// Guards the DEFAULT, not the value: the ramp ships equal to the detection range so this rework is behaviour-
// identical to the version reviewed at the gate. Someone may deliberately change it — this test is a tripwire
// that says "that is a FEEL change, declare it", not a prohibition.
describe( 'defaults', () => {
    it( 'ships with the vignette ramp equal to the detection range (behaviour-identical default)', () => {
        expect( VIGNETTE_RAMP_Z ).toBe( THREAT_Z );
    } );

    it( 'ships with a linear falloff', () => {
        expect( VIGNETTE_FALLOFF ).toBe( 1 );
    } );
} );
