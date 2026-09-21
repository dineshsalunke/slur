import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBoundarySpanGeometry } from './track-boundary';
import { buildSpanGeometry } from './track-floor';

const Z0 = 0;
const Z1 = SEG_LEN;

function atHeight( geo: THREE.BufferGeometry, y: number, facingUp = false ): number[] {
    const p = geo.getAttribute( 'position' );
    const n = geo.getAttribute( 'normal' );
    const out: number[] = [];
    for ( let i = 0; i < p.count; i++ ) {
        if ( Math.abs( p.getY( i ) - y ) > 1e-6 ) continue;
        if ( facingUp && n.getY( i ) < 0.9 ) continue;
        out.push( p.getX( i ) );
    }
    return out;
}

const spread = ( xs: number[] ) => ( { min: Math.min( ...xs ), max: Math.max( ...xs ) } );

const SETTINGS: Array< [ number, number ] > = [
    [ 0.25, 0 ],
    [ 1, 1 ],
    [ 2, 0.5 ],
    [ 4, 3 ],
    [ 7.5, 1 ],
];

describe( 'ADR-012 — no drawn element takes playable width, at any setting', () => {
    it( 'holds the deck top face at exactly ±HALF_WIDTH for every width and wrap', () => {
        for ( const [ w, h ] of SETTINGS ) {
            const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h );
            expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -HALF_WIDTH, max: HALF_WIDTH } );
        }
    } );

    it( 'puts no part of the rail inboard of the track edge, for every width and wrap', () => {
        for ( const [ w, h ] of SETTINGS ) {
            const rail = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h );
            const p = rail.getAttribute( 'position' );
            for ( let i = 0; i < p.count; i++ )
                expect( Math.abs( p.getX( i ) ) ).toBeGreaterThanOrEqual( HALF_WIDTH - 1e-6 );
        }
    } );
} );

describe( 'the rail stands outboard on the deck', () => {
    const w = 2;

    it( 'runs the band from the track edge out to edge + width', () => {
        for ( const [ ww, hh ] of SETTINGS ) {
            const band = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, ww, hh );
            expect( spread( atHeight( band, hh, true ) ) ).toEqual( { min: -HALF_WIDTH - ww, max: HALF_WIDTH + ww } );

            const inner = atHeight( band, hh, true ).filter( ( x ) => Math.abs( Math.abs( x ) - HALF_WIDTH ) < 1e-6 );
            expect( inner.length ).toBeGreaterThan( 0 );
        }
    } );

    it( 'is flush and riserless at wrap 0, which is why the slider reaches it', () => {
        const flush = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 0 );
        const p = flush.getAttribute( 'position' );

        let highest = -Infinity;
        for ( let i = 0; i < p.count; i++ ) highest = Math.max( highest, p.getY( i ) );
        expect( highest ).toBe( 0 );
        expect( p.count ).toBe( 12 );
    } );

    it( 'faces the riser inward — an outward one is invisible from the chase cam, every gate green', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1 );
        const p = strip.getAttribute( 'position' );
        const n = strip.getAttribute( 'normal' );

        for ( let i = 0; i < p.count; i++ ) {
            if ( Math.abs( p.getX( i ) - HALF_WIDTH ) > 1e-6 && Math.abs( p.getX( i ) + HALF_WIDTH ) > 1e-6 ) continue;
            if ( n.getY( i ) > 0.9 ) continue;
            expect( p.getX( i ) > 0 ? n.getX( i ) : -n.getX( i ) ).toBeLessThan( 0 );
        }
    } );

    it( 'hands the band its outer face and end section from the slab', () => {
        const h = 1;
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h );
        const p = deck.getAttribute( 'position' );

        let widest = 0;
        let highest = -Infinity;
        for ( let i = 0; i < p.count; i++ ) {
            widest = Math.max( widest, Math.abs( p.getX( i ) ) );
            highest = Math.max( highest, p.getY( i ) );
        }
        expect( widest ).toBe( HALF_WIDTH + w );
        expect( highest ).toBe( h );
    } );

    it( 'leaves interior span edges alone — those are gap rims, not the boundary', () => {
        const strip = buildBoundarySpanGeometry( -24, -8, Z0, Z1 );
        expect( strip.getAttribute( 'position' ).count ).toBe( 0 );

        const deck = buildSpanGeometry( -24, -8, Z0, Z1 );
        expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -24, max: -8 } );
    } );
} );

describe( 'the end cap follows the outer lip rather than squaring across it', () => {
    function capAt( geo: THREE.BufferGeometry, x: number ): number[] {
        const p = geo.getAttribute( 'position' );
        const n = geo.getAttribute( 'normal' );
        const out: number[] = [];
        for ( let i = 0; i < p.count; i++ ) {
            if ( Math.abs( p.getX( i ) - x ) > 1e-6 || Math.abs( p.getZ( i ) - Z0 ) > 1e-6 ) continue;
            if ( Math.abs( n.getZ( i ) ) < 0.9 ) continue;
            out.push( p.getY( i ) );
        }
        return out;
    }

    const [ w, h ] = [ 2, 0.5 ];

    it( 'rises to the band top at the outboard corner, and stays at deck height at the track edge', () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h );
        expect( Math.max( ...capAt( deck, HALF_WIDTH + w ) ) ).toBe( h );
        expect( Math.max( ...capAt( deck, HALF_WIDTH ) ) ).toBe( 0 );
    } );
} );
