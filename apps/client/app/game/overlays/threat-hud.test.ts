import { describe, expect, it } from 'vitest';
import { threatTick, vignetteOpacity } from './threat-hud';

// The vignette's opacity is the ONLY new gameplay-visible mapping (proximity → danger read), so it's the thing
// worth pinning. These are differential — monotonicity, clamps, and a loose subtlety bound — NOT the exact peak,
// which is a feel-gate tunable (VIGNETTE_MAX). Pinning the cap would make the test wrong the moment it's retuned.
describe( 'vignetteOpacity', () => {
    it( 'is 0 when there is no threat (bestDz = +Infinity)', () => {
        expect( vignetteOpacity( Number.POSITIVE_INFINITY ) ).toBe( 0 );
    } );

    it( 'is 0 once a bolt reaches the threat range edge', () => {
        expect( vignetteOpacity( 70 ) ).toBe( 0 ); // THREAT_Z — beyond warning distance
    } );

    it( 'grows strictly as the bolt closes in', () => {
        // Closer (smaller bestDz) → stronger. Proves the proximity is actually wired, not a constant.
        expect( vignetteOpacity( 0 ) ).toBeGreaterThan( vignetteOpacity( 35 ) );
        expect( vignetteOpacity( 35 ) ).toBeGreaterThan( vignetteOpacity( 69 ) );
        expect( vignetteOpacity( 69 ) ).toBeGreaterThan( 0 );
    } );

    it( 'saturates at the peak for a level / just-overtaken bolt (clamps negatives)', () => {
        expect( vignetteOpacity( -2 ) ).toBe( vignetteOpacity( 0 ) );
    } );

    it( 'stays subtle — the peak is a low cap, never a full-screen wash', () => {
        const peak = vignetteOpacity( 0 );
        expect( peak ).toBeGreaterThan( 0 );
        expect( peak ).toBeLessThanOrEqual( 0.5 );
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
