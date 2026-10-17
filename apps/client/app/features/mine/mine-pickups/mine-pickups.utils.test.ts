import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { mineAnchors } from './mine-pickups.utils';

describe( 'mineAnchors', () => {
    it( 'keeps every mine pickup and nothing else', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7, 'weave' ) ) );
        const mines = mineAnchors( layout );

        expect( mines.length ).toBeGreaterThan( 0 );
        expect( mines.length ).toBe( layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.mine ).length );
        for ( const a of mines ) expect( pickupPower( a.id ) ).toBe( HeldPower.mine );
    } );
} );
