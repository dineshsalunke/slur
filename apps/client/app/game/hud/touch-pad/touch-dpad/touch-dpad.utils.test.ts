import { describe, expect, it } from 'vitest';
import { dpadZone } from './touch-dpad.utils';

describe( 'dpadZone (#346)', () => {
    it( 'is jump near the centre', () => {
        expect( dpadZone( 0, 0, 100 ) ).toBe( 'jump' );
        expect( dpadZone( 25, -25, 100 ) ).toBe( 'jump' );
    } );

    it( 'picks the arm by the dominant axis', () => {
        expect( dpadZone( 0, -80, 100 ) ).toBe( 'up' );
        expect( dpadZone( 0, 80, 100 ) ).toBe( 'down' );
        expect( dpadZone( -80, 10, 100 ) ).toBe( 'left' );
        expect( dpadZone( 80, -10, 100 ) ).toBe( 'right' );
    } );

    it( 'lets a thumb slip a little past the rim, then releases', () => {
        expect( dpadZone( 110, 0, 100 ) ).toBe( 'right' );
        expect( dpadZone( 130, 0, 100 ) ).toBeNull();
    } );
} );
