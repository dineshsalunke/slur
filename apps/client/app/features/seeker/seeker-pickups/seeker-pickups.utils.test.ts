import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { seekerAnchors } from './seeker-pickups.utils';

describe( 'seekerAnchors', () => {
    it( 'keeps every seeker pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const seekers = seekerAnchors( layout );

        expect( seekers.length ).toBeGreaterThan( 0 );
        expect( seekers.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.seeker ).length );
        for ( const a of seekers ) expect( pickupPower( a.id ) ).toBe( HeldPower.seeker );
    } );
} );
