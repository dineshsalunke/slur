import { describe, expect, it } from 'vitest';
import { ASTEROID_BANDS, BELT_BAND, CORRIDOR_CLEARANCE, FLANK_BAND, MID_BAND } from './asteroid-config';
import { asteroidClearance, asteroidField, forEachAsteroid } from './asteroid-field';

const WINDOW: [ number, number ] = [ -80, 900 ];

const CAMERA_FAR = 1000;

describe( 'asteroidField', () => {
    it( 'never intrudes on the threadable corridor', () => {
        for ( const band of ASTEROID_BANDS ) {
            for ( const p of asteroidField( band, ...WINDOW ) ) {
                expect( asteroidClearance( p ) ).toBeGreaterThan( CORRIDOR_CLEARANCE );
            }
        }
    } );

    it( 'emits near to far so the limit drops far rocks, never near ones', () => {
        for ( const band of ASTEROID_BANDS ) {
            const zs = asteroidField( band, ...WINDOW ).map( ( p ) => p.z );
            for ( let i = 1; i < zs.length; i++ ) expect( zs[ i ] ).toBeGreaterThanOrEqual( zs[ i - 1 ] );
        }
    } );

    it( 'stays inside every band limit across the visible window', () => {
        for ( const band of ASTEROID_BANDS ) {
            expect( asteroidField( band, ...WINDOW ).length ).toBeLessThanOrEqual( band.limit );
        }
    } );

    it( 'keeps its radial extent inside the camera far plane', () => {
        for ( const band of ASTEROID_BANDS ) {
            for ( const p of asteroidField( band, ...WINDOW ) ) {
                expect( Math.hypot( p.x, p.y ) + p.size / 2 ).toBeLessThan( CAMERA_FAR );
            }
        }
    } );

    it( 'is deterministic for a given window', () => {
        const a = asteroidField( MID_BAND, ...WINDOW );
        const b = asteroidField( MID_BAND, ...WINDOW );
        expect( a ).toEqual( b );
    } );

    it( 'visits the same placements through one reused object', () => {
        const seen: unknown[] = [];
        const visited: string[] = [];
        forEachAsteroid( MID_BAND, ...WINDOW, ( p ) => {
            if ( ! seen.includes( p ) ) seen.push( p );
            visited.push( JSON.stringify( p ) );
        } );
        const listed = asteroidField( MID_BAND, ...WINDOW ).map( ( p ) => JSON.stringify( p ) );
        expect( seen ).toHaveLength( 1 );
        expect( visited.sort() ).toEqual( listed.sort() );
    } );

    it( 'agrees with itself across overlapping windows', () => {
        const wide = asteroidField( FLANK_BAND, 0, 600 ).filter( ( p ) => p.z >= 200 && p.z <= 400 );
        const narrow = asteroidField( FLANK_BAND, 200, 400 );
        expect( narrow ).toEqual( wide );
    } );

    it( 'fills both sides of the corridor in every band', () => {
        for ( const band of ASTEROID_BANDS ) {
            const xs = asteroidField( band, ...WINDOW ).map( ( p ) => p.x );
            expect( xs.some( ( x ) => x < 0 ) ).toBe( true );
            expect( xs.some( ( x ) => x > 0 ) ).toBe( true );
        }
    } );

    it( 'floats rock both above and below the deck in every band', () => {
        for ( const band of ASTEROID_BANDS ) {
            const ys = asteroidField( band, ...WINDOW ).map( ( p ) => p.y );
            expect( ys.some( ( y ) => y < 0 ) ).toBe( true );
            expect( ys.some( ( y ) => y > 0 ) ).toBe( true );
        }
    } );

    it( 'puts rock overhead in the belt but not in the flank', () => {
        const highest = ( band: typeof BELT_BAND ) =>
            Math.max( ...asteroidField( band, ...WINDOW ).map( ( p ) => p.y ) );
        expect( highest( BELT_BAND ) ).toBeGreaterThan( highest( FLANK_BAND ) * 3 );
    } );
} );
