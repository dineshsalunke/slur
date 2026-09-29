import { describe, expect, it } from 'vitest';
import { keyboardControls } from './controls-panel.utils';

describe( 'keyboardControls', () => {
    it( 'shows the one keyboard layout (#368)', () => {
        expect( Object.fromEntries( keyboardControls().map( ( h ) => [ h.does, h.keys ] ) ) ).toEqual( {
            Throttle: [ '↑' ],
            Brake: [ '↓' ],
            Strafe: [ '←', '→' ],
            Jump: [ 'Space' ],
            Fire: [ 'E' ],
            'Fire back': [ 'D' ],
            Slot: [ 'S', 'F' ],
            Drop: [ 'X' ],
            Mute: [ 'M' ],
        } );
    } );
} );
