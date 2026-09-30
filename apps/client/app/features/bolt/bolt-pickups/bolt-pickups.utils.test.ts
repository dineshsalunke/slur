import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { boltAnchors } from './bolt-pickups.utils';

describe( 'boltAnchors', () => {
    it( 'keeps every bolt pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const bolts = boltAnchors( layout );

        expect( bolts.length ).toBeGreaterThan( 0 );
        expect( bolts.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.bolt ).length );
        for ( const a of bolts ) expect( pickupPower( a.id ) ).toBe( HeldPower.bolt );
    } );
} );
