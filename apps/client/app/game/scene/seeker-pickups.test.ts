import { DEFAULT_SIM_CONFIG, HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SEEKER_FLIGHT, SEEKER_PICKUP, seekerCoreGeometry, seekerShellGeometry, seekerTail } from './seeker-look';
import { splitPickupLayout } from './seeker-pickups';

function bounds( g: THREE.BufferGeometry ): THREE.Box3 {
    g.computeBoundingBox();
    return g.boundingBox ?? new THREE.Box3();
}

describe( 'splitPickupLayout', () => {
    it( 'puts every pickup in exactly one field, by its shared power', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7 ) ) );
        const { bolts, seekers } = splitPickupLayout( layout );

        expect( bolts.length + seekers.length ).toBe( layout.length );
        expect( seekers.length ).toBeGreaterThan( 0 );
        for ( const a of seekers ) expect( pickupPower( a.id ) ).toBe( HeldPower.seeker );
        for ( const a of bolts ) expect( pickupPower( a.id ) ).toBe( HeldPower.bolt );
    } );
} );

describe( 'seeker in flight', () => {
    it( 'lies nose-forward along z with its hot core on the nose', () => {
        const s = bounds( seekerShellGeometry( SEEKER_FLIGHT ) );
        const c = bounds( seekerCoreGeometry( SEEKER_FLIGHT ) );

        expect( s.max.z - s.min.z ).toBeGreaterThan( s.max.x - s.min.x );
        expect( c.min.z ).toBeGreaterThanOrEqual( s.max.z );
    } );

    it( 'keeps its fins inside the sim body', () => {
        const s = bounds( seekerShellGeometry( SEEKER_FLIGHT ) );
        const half = DEFAULT_SIM_CONFIG.seekerHalf;

        for ( const v of [ s.max.x, -s.min.x, s.max.y, -s.min.y ] ) {
            expect( v ).toBeGreaterThan( SEEKER_FLIGHT.half );
            expect( v ).toBeLessThanOrEqual( half );
        }
    } );

    it( 'puts its nose on the front face of the sim body and trails the rest behind', () => {
        const s = bounds( seekerShellGeometry( SEEKER_FLIGHT ) );

        expect( s.max.z ).toBeCloseTo( DEFAULT_SIM_CONFIG.seekerHalf );
        expect( s.max.z - s.min.z ).toBeGreaterThanOrEqual( 2 * SEEKER_FLIGHT.halfLen );
        expect( -s.min.z ).toBeGreaterThanOrEqual( seekerTail( SEEKER_FLIGHT ) );
    } );
} );

describe( 'seeker pickup', () => {
    it( 'is a bar about three times longer than wide, centred on its anchor, with a core on both end faces', () => {
        const s = bounds( seekerShellGeometry( SEEKER_PICKUP ) );
        const c = bounds( seekerCoreGeometry( SEEKER_PICKUP ) );
        const ratio = ( s.max.z - s.min.z ) / ( s.max.x - s.min.x );

        expect( ratio ).toBeGreaterThan( 2.5 );
        expect( ratio ).toBeLessThan( 3.2 );
        expect( s.max.z + s.min.z ).toBeCloseTo( 0 );
        expect( c.min.z ).toBeLessThanOrEqual( s.min.z );
        expect( c.max.z ).toBeGreaterThanOrEqual( s.max.z );
    } );
} );
