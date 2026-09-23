import { describe, expect, it } from 'vitest';
import { advanceSeekerTrail, makeSeekerTrail, TRAIL_POINTS, TRAIL_SPACING, trailIndex } from './seeker-trail';

describe( 'seeker trail ring', () => {
    it( 'records a point only once the seeker has moved one spacing', () => {
        const r = makeSeekerTrail();
        advanceSeekerTrail( r, 0, 0, 0 );
        advanceSeekerTrail( r, 0, 0, TRAIL_SPACING * 0.5 );
        expect( r.count ).toBe( 1 );
        advanceSeekerTrail( r, 0, 0, TRAIL_SPACING );
        expect( r.count ).toBe( 2 );
        expect( r.z[ trailIndex( r, 0 ) ] ).toBe( TRAIL_SPACING );
        expect( r.z[ trailIndex( r, 1 ) ] ).toBe( 0 );
    } );

    it( 'keeps the newest points and drops the oldest when full', () => {
        const r = makeSeekerTrail();
        const steps = TRAIL_POINTS + 5;
        for ( let i = 0; i < steps; i++ ) advanceSeekerTrail( r, 0, 0, i * TRAIL_SPACING );
        expect( r.count ).toBe( TRAIL_POINTS );
        expect( r.z[ trailIndex( r, 0 ) ] ).toBe( ( steps - 1 ) * TRAIL_SPACING );
        expect( r.z[ trailIndex( r, TRAIL_POINTS - 1 ) ] ).toBe( ( steps - TRAIL_POINTS ) * TRAIL_SPACING );
    } );

    it( 'heads along the curve it flies', () => {
        const r = makeSeekerTrail();
        advanceSeekerTrail( r, 0, 0, 0 );
        advanceSeekerTrail( r, 3, 0, 4 );
        expect( r.hx ).toBeCloseTo( 0.6 );
        expect( r.hz ).toBeCloseTo( 0.8 );
    } );

    it( 'holds its heading while it sits still', () => {
        const r = makeSeekerTrail();
        advanceSeekerTrail( r, 0, 0, 0 );
        advanceSeekerTrail( r, 0, 0, 0 );
        expect( [ r.hx, r.hy, r.hz ] ).toEqual( [ 0, 0, 1 ] );
    } );
} );
