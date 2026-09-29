import { describe, expect, it } from 'vitest';
import { keyLabel } from './key-label';

describe( 'keyLabel', () => {
    it( 'shortens letter and digit codes', () => {
        expect( keyLabel( 'KeyQ' ) ).toBe( 'Q' );
        expect( keyLabel( 'Digit2' ) ).toBe( '2' );
    } );

    it( 'draws arrows and names Space', () => {
        expect( [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ].map( keyLabel ) ).toEqual( [
            '↑',
            '↓',
            '←',
            '→',
        ] );
        expect( keyLabel( 'Space' ) ).toBe( 'Space' );
    } );

    it( 'names the side of a modifier', () => {
        expect( keyLabel( 'ShiftLeft' ) ).toBe( 'L Shift' );
        expect( keyLabel( 'ShiftRight' ) ).toBe( 'R Shift' );
        expect( keyLabel( 'ControlRight' ) ).toBe( 'R Ctrl' );
        expect( keyLabel( 'ControlLeft' ) ).toBe( 'L Ctrl' );
    } );
} );
