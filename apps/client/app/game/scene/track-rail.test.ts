import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildSpanGeometry } from './track-floor';
import { RAIL_EMISSIVE_SHARE, RAIL_LIP_H, RAIL_MARGIN, RAIL_W, SLAB_THICKNESS } from './track-geometry';
import { buildRailGeometry } from './track-rail/track-rail.utils';
import type { RailRun } from './track-rails';

const Z0 = 0;
const Z1 = SEG_LEN;

const runs = ( ...sides: number[] ): RailRun[] =>
    sides.map( ( s ) => ( { x: s * ( HALF_WIDTH + RAIL_W / 2 ), y: 0, z0: Z0, z1: Z1 } ) );

function xsAt( geo: THREE.BufferGeometry, y: number, facingUp: boolean, group: number ): number[] {
    const p = geo.getAttribute( 'position' );
    const n = geo.getAttribute( 'normal' );
    const g = geo.groups[ group ];
    const out: number[] = [];
    for ( let i = g.start; i < g.start + g.count; i++ ) {
        if ( Math.abs( p.getY( i ) - y ) > 1e-6 ) continue;
        if ( facingUp && n.getY( i ) < 0.9 ) continue;
        out.push( p.getX( i ) );
    }
    return out;
}

const spread = ( xs: number[] ) => ( { min: Math.min( ...xs ), max: Math.max( ...xs ) } );

describe( 'ADR-012 — no drawn element takes playable width', () => {
    it( 'holds the deck top face at exactly ±HALF_WIDTH', () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1 );
        const p = deck.getAttribute( 'position' );
        for ( let i = 0; i < p.count; i++ ) expect( Math.abs( p.getX( i ) ) ).toBeLessThanOrEqual( HALF_WIDTH + 1e-6 );
    } );

    it( 'puts no part of the rail inboard of the track edge', () => {
        const p = buildRailGeometry( runs( -1, 1 ) ).getAttribute( 'position' );
        for ( let i = 0; i < p.count; i++ )
            expect( Math.abs( p.getX( i ) ) ).toBeGreaterThanOrEqual( HALF_WIDTH - 1e-6 );
    } );
} );

describe( 'the rail is a flush box outboard of the deck', () => {
    it( 'keeps the metal flush with the deck, and drops the full slab thickness', () => {
        const geo = buildRailGeometry( runs( -1, 1 ) );
        const p = geo.getAttribute( 'position' );
        const metal = geo.groups[ 0 ];
        let highest = -Infinity;
        let lowest = Infinity;
        for ( let i = metal.start; i < metal.start + metal.count; i++ ) {
            highest = Math.max( highest, p.getY( i ) );
            lowest = Math.min( lowest, p.getY( i ) );
        }
        expect( highest ).toBe( 0 );
        expect( lowest ).toBe( -SLAB_THICKNESS );
    } );

    it( 'lets only the strip stand proud, by exactly the lip height', () => {
        const p = buildRailGeometry( runs( -1, 1 ) ).getAttribute( 'position' );
        let highest = -Infinity;
        for ( let i = 0; i < p.count; i++ ) highest = Math.max( highest, p.getY( i ) );
        expect( highest ).toBeCloseTo( RAIL_LIP_H );
    } );

    it( 'spans the full rail width from the track edge outward', () => {
        const geo = buildRailGeometry( runs( 1 ) );
        const p = geo.getAttribute( 'position' );
        let widest = 0;
        for ( let i = 0; i < p.count; i++ ) widest = Math.max( widest, p.getX( i ) );
        expect( widest ).toBe( HALF_WIDTH + RAIL_W );
    } );

    it( 'draws no inner face — the deck slab seals that plane', () => {
        const geo = buildRailGeometry( runs( 1 ) );
        const p = geo.getAttribute( 'position' );
        const n = geo.getAttribute( 'normal' );
        for ( let i = 0; i < p.count; i++ ) {
            if ( Math.abs( p.getX( i ) - HALF_WIDTH ) > 1e-6 ) continue;
            expect( n.getX( i ) ).toBeGreaterThan( -0.9 );
        }
    } );
} );

describe( 'the emissive strip takes its share of the top face, centred', () => {
    it( 'lights its share of the width and leaves a metal margin each side', () => {
        const geo = buildRailGeometry( runs( 1 ) );
        const strip = spread( xsAt( geo, RAIL_LIP_H, true, 1 ) );

        expect( strip.min ).toBeCloseTo( HALF_WIDTH + RAIL_MARGIN );
        expect( strip.max ).toBeCloseTo( HALF_WIDTH + RAIL_W - RAIL_MARGIN );
        expect( strip.max - strip.min ).toBeCloseTo( RAIL_W * RAIL_EMISSIVE_SHARE );
    } );

    it( 'mirrors the strip on the left side', () => {
        const geo = buildRailGeometry( runs( -1 ) );
        const strip = spread( xsAt( geo, RAIL_LIP_H, true, 1 ) );

        expect( strip.max ).toBeCloseTo( -HALF_WIDTH - RAIL_MARGIN );
        expect( strip.min ).toBeCloseTo( -HALF_WIDTH - RAIL_W + RAIL_MARGIN );
    } );

    it.each( [ -1, 1 ] )( 'turns a lit face toward the track centre on side %i', ( s ) => {
        const geo = buildRailGeometry( runs( s ) );
        const p = geo.getAttribute( 'position' );
        const n = geo.getAttribute( 'normal' );
        const g = geo.groups[ 1 ];
        const ys: number[] = [];
        for ( let i = g.start; i < g.start + g.count; i++ ) {
            if ( n.getX( i ) * s > -0.9 ) continue;
            expect( p.getX( i ) ).toBeCloseTo( s * ( HALF_WIDTH + RAIL_MARGIN ) );
            ys.push( p.getY( i ) );
        }
        expect( spread( ys ) ).toEqual( { min: 0, max: RAIL_LIP_H } );
    } );

    it( 'hands every other face to the metal group', () => {
        const geo = buildRailGeometry( runs( 1 ) );
        const metalTop = spread( xsAt( geo, 0, true, 0 ) );

        expect( metalTop.min ).toBe( HALF_WIDTH );
        expect( metalTop.max ).toBe( HALF_WIDTH + RAIL_W );
        expect( geo.groups ).toHaveLength( 2 );
        expect( geo.groups[ 0 ].materialIndex ).toBe( 0 );
        expect( geo.groups[ 1 ].materialIndex ).toBe( 1 );
    } );
} );
