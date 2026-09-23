import { describe, expect, it } from 'vitest';
import { PICKUP_COLLECT_S, PICKUP_REVEAL_S, type PickupPose, pickupPose } from './pickup-pose';

const pose = (): PickupPose => ( { scale: 0, lift: 0, spin: 0 } );

describe( 'pickupPose', () => {
    it( 'starts a collect at full size', () => {
        expect( pickupPose( true, 0, pose() ).scale ).toBeCloseTo( 1 );
    } );

    it( 'finishes the collect fast enough to read at race speed', () => {
        expect( PICKUP_COLLECT_S ).toBeGreaterThanOrEqual( 0.11 );
        expect( PICKUP_COLLECT_S ).toBeLessThanOrEqual( 0.16 );
    } );

    it( 'is fully gone once the collect has played', () => {
        expect( pickupPose( true, PICKUP_COLLECT_S, pose() ).scale ).toBe( 0 );
        expect( pickupPose( true, 3, pose() ).scale ).toBe( 0 );
    } );

    it( 'shrinks monotonically through the collect after the swell', () => {
        const mid = pickupPose( true, PICKUP_COLLECT_S * 0.5, pose() ).scale;
        const late = pickupPose( true, PICKUP_COLLECT_S * 0.9, pose() ).scale;
        expect( late ).toBeLessThan( mid );
    } );

    it( 'grows back in from nothing and settles at rest', () => {
        expect( pickupPose( false, 0, pose() ).scale ).toBeCloseTo( 0 );
        const rest = pickupPose( false, PICKUP_REVEAL_S, pose() );
        expect( rest.scale ).toBeCloseTo( 1 );
        expect( rest.lift ).toBeCloseTo( 0 );
    } );

    it( 'overshoots slightly on the way in', () => {
        expect( pickupPose( false, PICKUP_REVEAL_S * 0.6, pose() ).scale ).toBeGreaterThan( 1 );
    } );
} );
