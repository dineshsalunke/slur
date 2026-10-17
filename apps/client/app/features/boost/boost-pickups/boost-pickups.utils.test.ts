import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { boostAnchors } from './boost-pickups.utils';

describe( 'boostAnchors', () => {
    it( 'keeps every boost pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const boosts = boostAnchors( layout );

        expect( boosts.length ).toBeGreaterThan( 0 );
        expect( boosts.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.boost ).length );
        for ( const a of boosts ) expect( pickupPower( a.id ) ).toBe( HeldPower.boost );
    } );
} );
