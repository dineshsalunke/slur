import { describe, expect, it } from 'vitest';
import { gapTo, ordinal, raceTime } from './results-format';

describe( 'raceTime', () => {
    it( 'formats minutes, seconds and centiseconds', () => {
        expect( raceTime( 102.37 ) ).toBe( '1:42.37' );
        expect( raceTime( 5.5 ) ).toBe( '0:05.50' );
    } );

    it( 'rounds to centiseconds before splitting, so 59.999 carries into the minute', () => {
        expect( raceTime( 59.999 ) ).toBe( '1:00.00' );
    } );
} );

describe( 'gapTo', () => {
    it( 'gives the rounded gap to the leader', () => {
        expect( gapTo( 102.37, 104.78 ) ).toBe( '+2.41' );
        expect( gapTo( 102.371, 102.374 ) ).toBe( '+0.00' );
    } );
} );

describe( 'ordinal', () => {
    it( 'uses st, nd, rd and th', () => {
        expect( [ 1, 2, 3, 4, 21, 22, 23, 101 ].map( ordinal ) ).toEqual( [
            '1st',
            '2nd',
            '3rd',
            '4th',
            '21st',
            '22nd',
            '23rd',
            '101st',
        ] );
    } );

    it( 'ends 11th to 13th in th', () => {
        expect( [ 11, 12, 13, 111, 112 ].map( ordinal ) ).toEqual( [ '11th', '12th', '13th', '111th', '112th' ] );
    } );
} );
