import { describe, expect, it } from 'vitest';
import { formatStart, parseStart, startOf, withStart } from './start-point.utils';

describe( 'parseStart', () => {
    it( 'reads an x,z pair', () => {
        expect( parseStart( '-12.5,340' ) ).toEqual( { x: -12.5, z: 340 } );
    } );

    it( 'rejects a missing, partial or non-numeric value', () => {
        for ( const v of [ null, '', '4', ',', '4,', ',8', 'a,8', '1,2,3', '4,Infinity' ] ) {
            expect( parseStart( v ) ).toBeNull();
        }
    } );
} );

describe( 'withStart', () => {
    it( 'adds the start beside the level and keeps the comma readable', () => {
        expect( withStart( '?level=ramp&v=abc', { x: 1.234, z: 200 } ) ).toBe( '?level=ramp&v=abc&start=1.23,200' );
    } );

    it( 'replaces an old start and round-trips through startOf', () => {
        const search = withStart( '?level=ramp&start=0,10', { x: -8, z: 96.5 } );
        expect( startOf( search ) ).toEqual( { x: -8, z: 96.5 } );
    } );

    it( 'removes the start and drops an empty search', () => {
        expect( withStart( '?level=ramp&start=0,10', null ) ).toBe( '?level=ramp' );
        expect( withStart( '?start=0,10', null ) ).toBe( '' );
    } );
} );

describe( 'formatStart', () => {
    it( 'rounds to two decimals', () => {
        expect( formatStart( { x: 1 / 3, z: 2 / 3 } ) ).toBe( '0.33,0.67' );
    } );
} );
