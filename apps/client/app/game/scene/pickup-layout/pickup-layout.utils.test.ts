import { FEATURE_POWERS, HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { splitPickupLayout } from './pickup-layout.utils';

describe( 'splitPickupLayout', () => {
    it( 'puts every core pickup in exactly one field, by its shared power, and leaves feature powers out', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const { mines, boosts, shields, portals } = splitPickupLayout( layout );
        const featureKinds = new Set< number >( FEATURE_POWERS.map( ( p ) => p.kind ) );
        const featured = layout.filter( ( a ) => featureKinds.has( pickupPower( a.id ) ) ).length;

        expect( featured ).toBeGreaterThan( 0 );
        expect( mines.length + boosts.length + shields.length + portals.length + featured ).toBe( layout.length );
        expect( mines.length ).toBeGreaterThan( 0 );
        expect( portals.length ).toBeGreaterThan( 0 );
        for ( const a of portals ) expect( pickupPower( a.id ) ).toBe( HeldPower.portal );
        for ( const a of mines ) expect( pickupPower( a.id ) ).toBe( HeldPower.mine );
        for ( const a of boosts ) expect( pickupPower( a.id ) ).toBe( HeldPower.boost );
        for ( const a of shields ) expect( pickupPower( a.id ) ).toBe( HeldPower.shield );
    } );
} );
