import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { tugAnchors } from './tug-pickups.utils';

describe( 'tugAnchors', () => {
    it( 'keeps every tug pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const tugs = tugAnchors( layout );

        expect( tugs.length ).toBeGreaterThan( 0 );
        expect( tugs.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.tug ).length );
        for ( const a of tugs ) expect( pickupPower( a.id ) ).toBe( HeldPower.tug );
    } );
} );
