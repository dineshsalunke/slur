import type { Anchor } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { placePickupEmitters, syncPickupEmitters } from './pickup-reflections.utils';

const LAYOUT: Anchor[] = [
    { id: 'a', kind: 'pickup', x: 3, y: 0, z: -40 },
    { id: 'b', kind: 'pickup', x: -5, y: 2, z: -90 },
];

describe( 'pickup reflection emitters', () => {
    it( 'places each anchor as a live translation', () => {
        const m = new Float32Array( 32 ).fill( 7 );
        placePickupEmitters( m, LAYOUT );
        expect( [ m[ 0 ], m[ 12 ], m[ 13 ], m[ 14 ], m[ 15 ] ] ).toEqual( [ 1, 3, 0, -40, 1 ] );
        expect( [ m[ 16 ], m[ 28 ], m[ 29 ], m[ 30 ] ] ).toEqual( [ 1, -5, 2, -90 ] );
        expect( m[ 1 ] ).toBe( 0 );
    } );

    it( 'switches a taken pickup off and reports the change once', () => {
        const m = new Float32Array( 32 );
        placePickupEmitters( m, LAYOUT );
        const taken = new Set( [ 'b' ] );
        const isTaken = ( id: string ) => taken.has( id );
        expect( syncPickupEmitters( m, LAYOUT, isTaken ) ).toBe( true );
        expect( [ m[ 0 ], m[ 16 ] ] ).toEqual( [ 1, 0 ] );
        expect( syncPickupEmitters( m, LAYOUT, isTaken ) ).toBe( false );
        taken.clear();
        expect( syncPickupEmitters( m, LAYOUT, isTaken ) ).toBe( true );
        expect( m[ 16 ] ).toBe( 1 );
    } );
} );
