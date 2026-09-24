import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { STRIKE_SPACING, STRIKE_START, strikeAt, strikeWindow } from './meteor-schedule';

const SLOTS = Array.from( { length: 400 }, ( _, i ) => i );

describe( 'meteor schedule', () => {
    it( 'picks the same strikes every time', () => {
        expect( SLOTS.map( ( s ) => strikeAt( s, 0.65 ) ) ).toEqual( SLOTS.map( ( s ) => strikeAt( s, 0.65 ) ) );
    } );

    it( 'lands every strike on the deck, away from the edge', () => {
        for ( const s of SLOTS.map( ( i ) => strikeAt( i, 1 ) ) ) {
            if ( ! s ) continue;
            expect( Math.abs( s.x ) ).toBeLessThan( HALF_WIDTH - 5 );
            expect( s.z ).toBeGreaterThanOrEqual( STRIKE_START - STRIKE_SPACING );
            expect( s.z ).toBeLessThanOrEqual( strikeWindow( s.slot ) );
        }
    } );

    it( 'comes down from above and ahead, never from behind the player', () => {
        for ( const s of SLOTS.map( ( i ) => strikeAt( i, 1 ) ) ) {
            if ( ! s ) continue;
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
        const sides = new Set( SLOTS.map( ( i ) => strikeAt( i, 1 ) ).map( ( s ) => Math.sign( s?.fromX ?? 0 ) ) );
        expect( sides.has( 1 ) && sides.has( -1 ) ).toBe( true );
    } );
} );
