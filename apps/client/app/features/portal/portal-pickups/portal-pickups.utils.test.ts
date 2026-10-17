import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { portalAnchors } from './portal-pickups.utils';

describe( 'portalAnchors', () => {
    it( 'keeps every portal pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const portals = portalAnchors( layout );

        expect( portals.length ).toBeGreaterThan( 0 );
        expect( portals.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.portal ).length );
        for ( const a of portals ) expect( pickupPower( a.id ) ).toBe( HeldPower.portal );
    } );
} );
