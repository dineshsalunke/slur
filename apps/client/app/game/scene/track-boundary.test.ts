import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBoundarySpanGeometry } from './track-boundary';
import { buildSpanGeometry } from './track-floor';
import { BOUNDARY_H, BOUNDARY_W } from './track-geometry';

// The deck and the boundary surface ONE solid between them: the deck omits exactly the facets the strip
// fills. Nothing in a type or a render catches a drift between the two — a gap at the corner or a pair of
// coplanar faces both look plausible and only the second one z-fights, intermittently. So it is pinned here.

const Z0 = 0;
const Z1 = SEG_LEN;

/**
 * X of every vertex this geometry places at height `y`. `facingUp` narrows that to the horizontal faces:
 * an end cap's top edge also sits at the deck's height, so without it the caps mask the notch entirely.
 */
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

describe( 'the boundary is embedded in the deck, not standing on it', () => {
    it( 'puts no boundary vertex above the deck', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1 );
        const p = strip.getAttribute( 'position' );
        let highest = -Infinity;
        for ( let i = 0; i < p.count; i++ ) highest = Math.max( highest, p.getY( i ) );

        // The excluded shape (board 24 panel 02, "raised rails") is precisely a positive value here.
        expect( highest ).toBe( 0 );
    } );

    it( 'wraps the corner rather than lying flat on it', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1 );
        expect( strip.getAttribute( 'position' ).count ).toBe( 24 ); // 4 quads: top + outer, both edges
        expect( spread( atHeight( strip, 0 ) ) ).toEqual( { min: -HALF_WIDTH, max: HALF_WIDTH } );
        expect( spread( atHeight( strip, -BOUNDARY_H ) ) ).toEqual( { min: -HALF_WIDTH, max: HALF_WIDTH } );
    } );

    it( 'meets the deck exactly — no seam to see through, no overlap to z-fight', () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1 );

        // The deck's top face stops where the strip's begins, on both sides.
        expect( spread( atHeight( deck, 0, true ) ) ).toEqual( {
            min: -HALF_WIDTH + BOUNDARY_W,
            max: HALF_WIDTH - BOUNDARY_W,
        } );
    } );

    it( 'still meets the deck exactly once the dimensions are tuned off their defaults', () => {
        const [ w, h ] = [ 2.5, 3 ];
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h );
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h );

        expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -HALF_WIDTH + w, max: HALF_WIDTH - w } );
        expect( spread( atHeight( strip, -h ) ) ).toEqual( { min: -HALF_WIDTH, max: HALF_WIDTH } );
    } );

    it( 'leaves interior span edges alone — those are gap rims, not the boundary', () => {
        const strip = buildBoundarySpanGeometry( -24, -8, Z0, Z1 );
        expect( strip.getAttribute( 'position' ).count ).toBe( 0 );

        // ...and the deck keeps its full top face there, un-notched.
        const deck = buildSpanGeometry( -24, -8, Z0, Z1 );
        expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -24, max: -8 } );
    } );

    it( 'faces the strip outward', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1 );
        const p = strip.getAttribute( 'position' );
        const n = strip.getAttribute( 'normal' );

        // Winding is computed from an intended normal rather than hand-ordered, so this is the check that
        // the intent was right. An inverted facet vanishes under backface culling with every gate green.
        for ( let i = 0; i < p.count; i++ ) {
            if ( p.getX( i ) === HALF_WIDTH && p.getY( i ) === -BOUNDARY_H ) expect( n.getX( i ) ).toBeGreaterThan( 0 );
            if ( p.getX( i ) === -HALF_WIDTH && p.getY( i ) === -BOUNDARY_H ) expect( n.getX( i ) ).toBeLessThan( 0 );
        }
    } );
} );
