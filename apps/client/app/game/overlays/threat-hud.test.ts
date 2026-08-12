import { describe, expect, it } from 'vitest';
import { THREAT_Z, threatTick, VIGNETTE_MAX, vignetteOpacity } from './threat-hud';

// The vignette's opacity is the ONLY new gameplay-visible mapping (proximity → danger read), so it's the thing
// worth pinning. These are differential — monotonicity, clamps, and a loose subtlety bound — NOT the exact peak,
// which is a feel-gate tunable (VIGNETTE_MAX). Boundaries are DERIVED from the exported constants (THREAT_Z /
// VIGNETTE_MAX), so a pure feel retune (e.g. THREAT_Z 70→90, VIGNETTE_MAX 0.42→0.55) does NOT redden the suite —
// only a change to the mapping's shape does.
describe( 'vignetteOpacity', () => {
    it( 'is 0 when there is no threat (bestDz = +Infinity)', () => {
        expect( vignetteOpacity( Number.POSITIVE_INFINITY ) ).toBe( 0 );
    } );

    it( 'is 0 once a bolt reaches the threat range edge', () => {
        expect( vignetteOpacity( THREAT_Z ) ).toBe( 0 ); // at/beyond warning distance
    } );

    it( 'grows strictly as the bolt closes in', () => {
        // Closer (smaller bestDz) → stronger. Proves the proximity is actually wired, not a constant. Sample
        // points are fractions of THREAT_Z so they track the range rather than pinning 35 / 69.
        expect( vignetteOpacity( 0 ) ).toBeGreaterThan( vignetteOpacity( THREAT_Z / 2 ) );
        expect( vignetteOpacity( THREAT_Z / 2 ) ).toBeGreaterThan( vignetteOpacity( THREAT_Z - 1 ) );
        expect( vignetteOpacity( THREAT_Z - 1 ) ).toBeGreaterThan( 0 );
    } );

    it( 'saturates at the peak for a level / just-overtaken bolt (clamps negatives)', () => {
        expect( vignetteOpacity( -2 ) ).toBe( vignetteOpacity( 0 ) );
    } );

    it( 'peaks exactly at the VIGNETTE_MAX cap, never above (stays subtle)', () => {
        expect( vignetteOpacity( 0 ) ).toBe( VIGNETTE_MAX );
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
