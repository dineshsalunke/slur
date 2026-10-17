import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { shieldAnchors } from './shield-pickups.utils';

describe( 'shieldAnchors', () => {
    it( 'keeps every shield pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const shields = shieldAnchors( layout );

        expect( shields.length ).toBeGreaterThan( 0 );
        expect( shields.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.shield ).length );
        for ( const a of shields ) expect( pickupPower( a.id ) ).toBe( HeldPower.shield );
    } );
} );
