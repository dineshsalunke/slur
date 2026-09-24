import { emptyInput, spawnShip } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { emptyKeys, emptyTicks, INPUT_BITS, inputBits, pushKey, pushTick } from './take-format';

describe( 'inputBits', () => {
    it( 'is zero for no input', () => {
        expect( inputBits( emptyInput() ) ).toBe( 0 );
    } );

    it( 'sets left for positive strafe and right for negative strafe', () => {
        expect( inputBits( { ...emptyInput(), strafe: 1 } ) ).toBe( INPUT_BITS.left );
        expect( inputBits( { ...emptyInput(), strafe: -1 } ) ).toBe( INPUT_BITS.right );
    } );

    it( 'combines throttle, brake and jump', () => {
        const bits = inputBits( { ...emptyInput(), throttle: 1, brake: 1, jump: true } );
        expect( bits ).toBe( INPUT_BITS.throttle | INPUT_BITS.brake | INPUT_BITS.jump );
    } );
} );

describe( 'columns', () => {
    it( 'keeps every tick column the same length and rounds to 3 decimals', () => {
        const t = emptyTicks();
        const s = { ...spawnShip(), x: 1.23456, vz: 99.99951 };
        pushTick( t, 0, 12.34567, 5, s );
        pushTick( t, 1, 29.0, 0, s );
        const lengths = new Set( Object.values( t ).map( ( c ) => c.length ) );
        expect( [ ...lengths ] ).toEqual( [ 2 ] );
        expect( t.x[ 0 ] ).toBe( 1.235 );
        expect( t.vz[ 0 ] ).toBe( 100 );
        expect( t.songMs[ 0 ] ).toBe( 12.346 );
    } );

    it( 'stores key down as 1 and key up as 0', () => {
        const k = emptyKeys();
        pushKey( k, 100, 6, 'KeyA', true );
        pushKey( k, 180.5, 11, 'KeyA', false );
        expect( k ).toEqual( { songMs: [ 100, 180.5 ], tick: [ 6, 11 ], code: [ 'KeyA', 'KeyA' ], down: [ 1, 0 ] } );
    } );
} );
