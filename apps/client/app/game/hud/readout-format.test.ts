import { describe, expect, it } from 'vitest';
import { clockText, progressText, rankText, speedText } from './readout-format';

describe( 'speedText', () => {
    it( 'rounds to a whole unit', () => {
        expect( speedText( 54.6 ) ).toBe( '55' );
        expect( speedText( 0.4 ) ).toBe( '0' );
    } );

    it( 'never shows a negative speed', () => {
        expect( speedText( -12 ) ).toBe( '0' );
    } );

    it( 'survives a non-finite velocity', () => {
        expect( speedText( Number.NaN ) ).toBe( '0' );
    } );
} );

describe( 'progressText', () => {
    it( 'reports the fraction of the track behind the ship', () => {
        expect( progressText( 840, 2000 ) ).toBe( '42%' );
    } );

    it( 'clamps to both ends', () => {
        expect( progressText( -40, 2000 ) ).toBe( '0%' );
        expect( progressText( 9000, 2000 ) ).toBe( '100%' );
    } );

    it( 'does not divide by a zero-length track', () => {
        expect( progressText( 100, 0 ) ).toBe( '0%' );
    } );
} );

describe( 'clockText', () => {
    it( 'pads both fields', () => {
        expect( clockText( 48 ) ).toBe( '00:48' );
        expect( clockText( 9.9 ) ).toBe( '00:09' );
    } );

    it( 'carries into minutes', () => {
        expect( clockText( 61 ) ).toBe( '01:01' );
        expect( clockText( 3599 ) ).toBe( '59:59' );
    } );

    it( 'floors rather than rounds, so the clock never reads ahead of the race', () => {
        expect( clockText( 47.99 ) ).toBe( '00:47' );
    } );

    it( 'clamps a negative clock', () => {
        expect( clockText( -5 ) ).toBe( '00:00' );
    } );
} );

describe( 'rankText', () => {
    it( 'matches the board spacing', () => {
        expect( rankText( 4, 8 ) ).toBe( '4 / 8' );
    } );
} );
