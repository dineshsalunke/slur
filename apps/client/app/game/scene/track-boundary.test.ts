import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBoundarySpanGeometry } from './track-boundary';
import { buildSpanGeometry } from './track-floor';
import { BOUNDARY_H, BOUNDARY_W } from './track-geometry';

// The deck and the boundary surface ONE solid: the deck omits exactly the facets the strip fills. Neither a
// type nor a render catches a drift — a corner gap and coplanar faces both look plausible, and only the
// second z-fights, intermittently.

const Z0 = 0;
const Z1 = SEG_LEN;

/** X of every vertex at height `y`. `facingUp` narrows to horizontal faces: an end cap's top edge sits at
 *  the deck's height too, so without it the caps mask the notch entirely. */
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

        const deck = buildSpanGeometry( -24, -8, Z0, Z1 );
        expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -24, max: -8 } );
    } );

    it( 'faces the strip outward', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1 );
        const p = strip.getAttribute( 'position' );
        const n = strip.getAttribute( 'normal' );

        // Winding is computed from an intended normal, so this checks the INTENT was right.
        for ( let i = 0; i < p.count; i++ ) {
            if ( p.getX( i ) === HALF_WIDTH && p.getY( i ) === -BOUNDARY_H ) expect( n.getX( i ) ).toBeGreaterThan( 0 );
            if ( p.getX( i ) === -HALF_WIDTH && p.getY( i ) === -BOUNDARY_H ) expect( n.getX( i ) ).toBeLessThan( 0 );
        }
    } );
} );

describe( 'variant B flares outboard instead of eating deck', () => {
    const [ w, h ] = [ 2, 0.4 ];

    it( 'leaves the deck its full top face out to the track edge', () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'B' ); // A insets this by w
        expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -HALF_WIDTH, max: HALF_WIDTH } );
    } );

    it( 'puts the strip entirely outboard, and never above the deck', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'B' );
        const p = strip.getAttribute( 'position' );

        let highest = -Infinity;
        let inboard = 0;
        for ( let i = 0; i < p.count; i++ ) {
            highest = Math.max( highest, p.getY( i ) );
            if ( Math.abs( p.getX( i ) ) < HALF_WIDTH - 1e-6 ) inboard++;
        }

        expect( highest ).toBe( 0 );
        expect( inboard ).toBe( 0 );
        expect( p.count ).toBe( 12 ); // one sloped quad per side, where A emits two
        expect( spread( atHeight( strip, -h ) ) ).toEqual( { min: -HALF_WIDTH - w, max: HALF_WIDTH + w } );
    } );

    it( 'hands off to a slab wall that moved out to meet the flare', () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'B' );
        const p = deck.getAttribute( 'position' );

        // Flare lip and slab wall must share an x, or you see into the slab from below — invisible in a render.
        let widest = 0;
        for ( let i = 0; i < p.count; i++ ) widest = Math.max( widest, Math.abs( p.getX( i ) ) );
        expect( widest ).toBe( HALF_WIDTH + w );
    } );

    it( 'faces the flare up and outward, not down into the slab', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'B' );
        const p = strip.getAttribute( 'position' );
        const n = strip.getAttribute( 'normal' );

        // +y is the load-bearing half: a correct-but-sideways normal is invisible from the chase cam.
        for ( let i = 0; i < p.count; i++ ) {
            expect( n.getY( i ) ).toBeGreaterThan( 0 );
            if ( p.getX( i ) > 0 ) expect( n.getX( i ) ).toBeGreaterThan( 0 );
            if ( p.getX( i ) < 0 ) expect( n.getX( i ) ).toBeLessThan( 0 );
        }
    } );
} );

describe( 'variant D stands the band outboard and leaves the deck alone', () => {
    const w = 2;

    it( 'holds the deck edge at ±HALF_WIDTH and the band at [edge, edge+width], for every width', () => {
        for ( const [ ww, hh ] of [
            [ 1, 0 ],
            [ 2, 0.5 ],
            [ 4, 3 ],
            [ 7.5, 1 ],
        ] ) {
            const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, ww, hh, 'D' );
            expect( spread( atHeight( deck, 0, true ) ) ).toEqual( { min: -HALF_WIDTH, max: HALF_WIDTH } );

            // Inner face flush at ±32, outer at ±(32 + width) — centred on ±32 would straddle the edge.
            const band = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, ww, hh, 'D' );
            expect( spread( atHeight( band, hh, true ) ) ).toEqual( { min: -HALF_WIDTH - ww, max: HALF_WIDTH + ww } );
            const inner = atHeight( band, hh, true ).filter( ( x ) => Math.abs( Math.abs( x ) - HALF_WIDTH ) < 1e-6 );
            expect( inner.length ).toBeGreaterThan( 0 );
        }
    } );

    it( 'puts no part of the band inboard of the track edge', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 0.5, 'D' );
        const p = strip.getAttribute( 'position' );

        let inboard = 0;
        for ( let i = 0; i < p.count; i++ ) if ( Math.abs( p.getX( i ) ) < HALF_WIDTH - 1e-6 ) inboard++;
        expect( inboard ).toBe( 0 );
    } );

    it( 'is flush and riserless at wrap 0, which is why the slider reaches it', () => {
        const flush = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 0, 'D' );
        const p = flush.getAttribute( 'position' );

        let highest = -Infinity;
        for ( let i = 0; i < p.count; i++ ) highest = Math.max( highest, p.getY( i ) );
        expect( highest ).toBe( 0 );
        expect( p.count ).toBe( 12 ); // one top-face quad per side, and no riser
    } );

    it( 'faces the riser inward — an outward one is invisible from the chase cam, every gate green', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1, 'D' );
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
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'D' );
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

    it( "drops to B's flare lip at the outboard corner", () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'B' );
        expect( Math.max( ...capAt( deck, HALF_WIDTH + w ) ) ).toBe( -h );
        expect( Math.max( ...capAt( deck, HALF_WIDTH ) ) ).toBe( 0 );
    } );

    it( "rises to D's band top at the outboard corner", () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'D' );
        expect( Math.max( ...capAt( deck, HALF_WIDTH + w ) ) ).toBe( h );
        expect( Math.max( ...capAt( deck, HALF_WIDTH ) ) ).toBe( 0 );
    } );

    it( 'leaves the inboard variants their single square cap', () => {
        const deck = buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, h, 'A' );
        expect( capAt( deck, HALF_WIDTH ).length ).toBe( 3 );
        expect( Math.max( ...capAt( deck, HALF_WIDTH ) ) ).toBe( 0 );
    } );
} );

describe( 'variant C ramps the marigold inward instead of ending it on a line', () => {
    const w = 3;

    it( 'writes a uv1 ramp that is full at the track edge and gone by the inner lip', () => {
        const strip = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1, 'C' );
        const p = strip.getAttribute( 'position' );
        const ramp = strip.getAttribute( 'uv1' );

        // Without it the map samples `uv` and the strip renders as tiled grain, every other gate green.
        expect( ramp ).toBeDefined();
        expect( ramp.count ).toBe( p.count );

        for ( let i = 0; i < p.count; i++ ) {
            const expected = Math.min( 1, Math.max( 0, 1 - ( HALF_WIDTH - Math.abs( p.getX( i ) ) ) / w ) );
            expect( ramp.getX( i ) ).toBeCloseTo( expected, 6 );
        }
    } );

    it( "keeps A's geometry exactly — C is a material change, not a shape change", () => {
        const a = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1, 'A' );
        const c = buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1, 'C' );

        expect( Array.from( c.getAttribute( 'position' ).array ) ).toEqual(
            Array.from( a.getAttribute( 'position' ).array ),
        );
    } );

    it( 'leaves A and B without the attribute, so neither pays for it', () => {
        expect(
            buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1, 'A' ).getAttribute( 'uv1' ),
        ).toBeUndefined();
        expect(
            buildBoundarySpanGeometry( -HALF_WIDTH, HALF_WIDTH, Z0, Z1, w, 1, 'B' ).getAttribute( 'uv1' ),
        ).toBeUndefined();
    } );
} );
