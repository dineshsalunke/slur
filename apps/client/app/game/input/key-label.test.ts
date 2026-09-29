import { describe, expect, it } from 'vitest';
import { keyLabel } from './key-label';

describe( 'keyLabel', () => {
    it( 'shortens letter codes', () => {
        expect( [ 'KeyE', 'KeyD', 'KeyS', 'KeyF', 'KeyX', 'KeyB' ].map( keyLabel ) ).toEqual( [
            'E',
            'D',
            'S',
            'F',
            'X',
            'B',
        ] );
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
} );
