import { describe, expect, it } from 'vitest';
import { DRAW_MAX, TIER_PLAN } from './black-hole.constants';
import { type Landmark, type LandmarkConfig, parseBlackHole, placeLandmark, tierPlan } from './black-hole.utils';
import { hash31, noiseVolumeData } from './black-hole-noise.utils';

const CFG: LandmarkConfig = { behind: 400, height: 150, radius: 900, minAngle: 7, side: 0, parallax: 1 };

function fresh(): Landmark {
    return { visible: false, x: 0, y: 0, z: 0, half: 0, drawDistance: 0, yaw: 0 };
}

describe( 'black hole noise volume', () => {
    it( 'is deterministic and fills every byte', () => {
        const a = noiseVolumeData( 8, 13 );
        const b = noiseVolumeData( 8, 13 );
        expect( a ).toEqual( b );
        expect( a.length ).toBe( 512 );
        expect( new Set( a ).size ).toBeGreaterThan( 100 );
    } );

    it( 'hashes into the unit interval', () => {
        for ( let i = -20; i < 20; i++ ) {
            const h = hash31( i, i * 3, 13 * 1024 + i );
            expect( h ).toBeGreaterThanOrEqual( 0 );
            expect( h ).toBeLessThan( 1 );
        }
    } );

    it( 'changes with the seed', () => {
        expect( noiseVolumeData( 8, 13 ) ).not.toEqual( noiseVolumeData( 8, 14 ) );
    } );
} );

describe( 'black hole landmark placement', () => {
    it( 'draws inside the far plane and keeps the angular size', () => {
        const out = placeLandmark( 0, 5, 0, 8400, CFG, fresh() );
        expect( out.visible ).toBe( true );
        expect( out.drawDistance ).toBe( DRAW_MAX );
        expect( out.z ).toBe( DRAW_MAX );
        expect( out.half / out.drawDistance ).toBeCloseTo( Math.tan( CFG.minAngle * ( Math.PI / 180 ) ), 6 );
    } );

    it( 'grows past the angle floor as the ship closes in', () => {
        const far = placeLandmark( 0, 5, 0, 8400, CFG, fresh() );
        const near = placeLandmark( 0, 5, 7600, 8400, CFG, fresh() );
        expect( near.half / near.drawDistance ).toBeGreaterThan( far.half / far.drawDistance );
        expect( near.half ).toBeCloseTo( CFG.radius * ( near.drawDistance / 1200 ), 6 );
    } );

    it( 'sits at its true place once inside the draw range', () => {
        const out = placeLandmark( 3, 5, 8000, 8400, CFG, fresh() );
        expect( out.z ).toBeCloseTo( 8800, 6 );
        expect( out.y ).toBeCloseTo( CFG.height, 6 );
        expect( out.x ).toBeCloseTo( 0, 6 );
    } );

    it( 'holds a fixed bearing to screen right', () => {
        const cfg = { ...CFG, side: 20 };
        const tan = Math.tan( 20 * ( Math.PI / 180 ) );
        for ( const camZ of [ 0, 4200, 8000 ] ) {
            const out = placeLandmark( 0, 5, camZ, 8400, cfg, fresh() );
            expect( -out.x / ( out.z - camZ ) ).toBeCloseTo( tan, 6 );
        }
    } );

    it( 'hides once the ship is past it', () => {
        expect( placeLandmark( 0, 5, 8790, 8400, CFG, fresh() ).visible ).toBe( false );
    } );

    it( 'turns the disk with the lateral offset', () => {
        const left = placeLandmark( -10, 5, 7000, 8400, CFG, fresh() );
        const right = placeLandmark( 10, 5, 7000, 8400, CFG, fresh() );
        expect( left.yaw ).toBeCloseTo( -right.yaw, 9 );
        expect( right.yaw ).toBeGreaterThan( 0 );
    } );
} );

describe( 'black hole tiers', () => {
    it( 'freezes the low tier and under reduced motion', () => {
        expect( tierPlan( 'low', false ).frozen ).toBe( true );
        expect( tierPlan( 'high', true ).frozen ).toBe( true );
        expect( tierPlan( 'high', false ) ).toBe( TIER_PLAN.high );
    } );

    it( 'reads only known placements from the URL', () => {
        expect( parseBlackHole( new URLSearchParams( 'blackhole=finish' ) ) ).toBe( 'finish' );
        expect( parseBlackHole( new URLSearchParams( 'blackhole=sky' ) ) ).toBeNull();
        expect( parseBlackHole( new URLSearchParams( '' ) ) ).toBeNull();
    } );
} );
