import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    EDGE,
    type Impact,
    impactFor,
    LATERAL,
    STRIKE_SPACING,
    STRIKE_START,
    strikeAt,
    strikeWindow,
} from './meteor-schedule';

const SLOTS = Array.from( { length: 400 }, ( _, i ) => i );
const LIVE = SLOTS.map( ( i ) => strikeAt( i, 1 ) ).filter( ( s ) => s !== null );

describe( 'meteor schedule', () => {
    it( 'picks the same strikes every time', () => {
        expect( SLOTS.map( ( s ) => strikeAt( s, 0.65 ) ) ).toEqual( SLOTS.map( ( s ) => strikeAt( s, 0.65 ) ) );
    } );

    it( 'triggers each strike inside its own slot window', () => {
        for ( const s of LIVE ) {
            expect( s.z ).toBeGreaterThanOrEqual( STRIKE_START - STRIKE_SPACING );
            expect( s.z ).toBeLessThanOrEqual( strikeWindow( s.slot ) );
            expect( Math.abs( s.side ) ).toBeLessThanOrEqual( 1 );
            expect( s.reach ).toBeGreaterThan( 0.5 );
        }
    } );

    it( 'lands every strike ahead of the focus, beside it, on the deck', () => {
        const out: Impact = { x: 0, z: 0 };
        for ( const focusX of [ 0, HALF_WIDTH - 2, -HALF_WIDTH + 2 ] ) {
            for ( const s of LIVE ) {
                impactFor( s, focusX, 1000, 55, 1.4, 65, out );
                expect( Math.abs( out.x ) ).toBeLessThanOrEqual( HALF_WIDTH - EDGE );
                expect( Math.abs( out.x - focusX ) ).toBeLessThanOrEqual( LATERAL + EDGE );
                expect( out.z ).toBeGreaterThan( 1000 + 55 * 1.4 + 65 * 0.5 );
                expect( out.z ).toBeLessThan( 1000 + 55 * 1.4 + 65 * 1.5 );
            }
        }
    } );

    it( 'leads a faster focus by its flight distance', () => {
        const s = LIVE[ 0 ];
        const slow = impactFor( s, 0, 0, 30, 1.4, 65, { x: 0, z: 0 } ).z;
        const fast = impactFor( s, 0, 0, 90, 1.4, 65, { x: 0, z: 0 } ).z;
        expect( fast - slow ).toBeCloseTo( 60 * 1.4, 9 );
    } );

    it( 'comes down from above and ahead, never from behind the player', () => {
        for ( const s of LIVE ) {
            expect( Math.hypot( s.fromX, s.fromY, s.fromZ ) ).toBeCloseTo( 1, 9 );
            expect( s.fromY ).toBeGreaterThan( 0.3 );
            expect( s.fromZ ).toBeGreaterThan( 0.1 );
        }
    } );

    it( 'keeps the start of the track clear', () => {
        for ( let i = 0; i * STRIKE_SPACING < STRIKE_START; i++ ) expect( strikeAt( i, 1 ) ).toBeNull();
    } );

    it( 'strikes about as often as the chance asks', () => {
        const live = SLOTS.filter( ( i ) => i * STRIKE_SPACING >= STRIKE_START );
        const hits = live.filter( ( i ) => strikeAt( i, 0.5 ) ).length / live.length;
        expect( hits ).toBeGreaterThan( 0.4 );
        expect( hits ).toBeLessThan( 0.6 );
        expect( live.filter( ( i ) => strikeAt( i, 0 ) ) ).toHaveLength( 0 );
    } );

    it( 'comes from both sides of the track', () => {
        const sides = new Set( LIVE.map( ( s ) => Math.sign( s.fromX ) ) );
        expect( sides.has( 1 ) && sides.has( -1 ) ).toBe( true );
    } );
} );
