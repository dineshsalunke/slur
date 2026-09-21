import { describe, expect, it } from 'vitest';
import { THREAT_Z, threatTick, VIGNETTE_FALLOFF, VIGNETTE_MAX, VIGNETTE_RAMP_Z, vignetteOpacity } from './threat-hud';

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

    it( 'ramps over VIGNETTE_RAMP_Z, independently of the THREAT_Z detection range', () => {
        expect( vignetteOpacity( VIGNETTE_RAMP_Z / 2 ) ).toBeCloseTo( 0.5 ** VIGNETTE_FALLOFF * VIGNETTE_MAX, 10 );
    } );
} );

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

describe( 'defaults', () => {
    it( 'ships with the vignette ramp equal to the detection range (behaviour-identical default)', () => {
        expect( VIGNETTE_RAMP_Z ).toBe( THREAT_Z );
    } );

    it( 'ships with a linear falloff', () => {
        expect( VIGNETTE_FALLOFF ).toBe( 1 );
    } );
} );
