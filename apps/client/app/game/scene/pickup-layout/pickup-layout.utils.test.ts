import { FEATURE_POWERS, HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { splitPickupLayout } from './pickup-layout.utils';

describe( 'splitPickupLayout', () => {
    it( 'puts every core pickup in exactly one field, by its shared power, and leaves feature powers out', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const { portals } = splitPickupLayout( layout );
        const featureKinds = new Set< number >(
            FEATURE_POWERS.map( ( p ) => p.kind ).filter( ( k ) => k !== HeldPower.portal ),
        );
        const featured = layout.filter( ( a ) => featureKinds.has( pickupPower( a.id ) ) ).length;

        expect( featured ).toBeGreaterThan( 0 );
        expect( portals.length + featured ).toBe( layout.length );
        expect( portals.length ).toBeGreaterThan( 0 );
        for ( const a of portals ) expect( pickupPower( a.id ) ).toBe( HeldPower.portal );
    } );
} );
