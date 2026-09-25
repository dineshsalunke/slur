import { describe, expect, it } from 'vitest';
import { EMBER_END, emberColor } from './meteor-scorch';

const GAIN = 1.4;
const COOL = 3.5;

function level( age: number ): number {
    const c = emberColor( age, 0, GAIN, COOL );
    return Math.max( c.r, c.g, c.b );
}

describe( 'emberColor', () => {
    it( 'ends at one second', () => {
        expect( EMBER_END ).toBe( 1 );
    } );

    it( 'is black at and after the end', () => {
        for ( const age of [ EMBER_END, EMBER_END + 0.01, 2, 5, 12 ] ) expect( level( age ) ).toBe( 0 );
    } );

    it( 'glows at the hit', () => {
        expect( level( 0 ) ).toBeGreaterThan( 0.5 );
    } );

    it( 'fades toward the end', () => {
        expect( level( 0.5 ) ).toBeLessThan( level( 0 ) );
        expect( level( 0.9 ) ).toBeLessThan( level( 0.5 ) );
        expect( level( 0.99 ) ).toBeLessThan( 0.01 );
    } );
} );
