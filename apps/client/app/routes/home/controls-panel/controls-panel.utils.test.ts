import { describe, expect, it } from 'vitest';
import { keyboardControls } from './controls-panel.utils';

const keysFor = ( mac: boolean ) => Object.fromEntries( keyboardControls( mac ).map( ( h ) => [ h.does, h.keys ] ) );

describe( 'keyboardControls', () => {
    it( 'shows the Blur layout on a full keyboard', () => {
        expect( keysFor( false ) ).toEqual( {
            Throttle: [ 'Q' ],
            Brake: [ 'A', '↓' ],
            Strafe: [ '←', '→' ],
            Jump: [ 'Space' ],
            Fire: [ 'R Ctrl' ],
            'Fire back': [ 'R Shift' ],
            Cycle: [ '↑' ],
            Drop: [ 'L Ctrl' ],
            Mute: [ 'M' ],
        } );
    } );

    it( 'swaps fire and drop to keys a Mac keyboard has', () => {
        const mac = keysFor( true );
        expect( mac.Fire ).toEqual( [ 'L Shift' ] );
        expect( mac.Drop ).toEqual( [ 'X' ] );
    } );
} );
