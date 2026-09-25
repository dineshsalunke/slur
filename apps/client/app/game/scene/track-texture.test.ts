import { describe, expect, it } from 'vitest';
import { buildSpanGeometry, FLOOR_SIDE_GROUP, FLOOR_TOP_GROUP } from './track-floor';
import { uvFor } from './track-geometry';
import { pitPlan, type SurfaceParams, TEX_SPAN_X, TEX_SPAN_Z, texelDensity } from './track-texture';

const deck: SurfaceParams = {
    plate: 4,
    base: '#4a4d52',
    joints: true,
    jointWidth: 0.15,
    wallTilt: 0.05,
    bevelShare: 0.05,
    jointMetal: 1,
    jointRough: 1,
    jointContrast: 1,
    cavity: 0.3,
    pitDensity: 2.5,
    pitTilt: 0.35,
    pitRough: 0.12,
    pitCavity: 0.5,
};
const graphite: SurfaceParams = { ...deck, joints: false };

describe( 'graphite surface', () => {
    it( 'paints the jointless tile at the same texel density on both axes', () => {
        const d = texelDensity( graphite );
        expect( d.pxPerV ).toBe( d.pxPerU );
    } );

    it( 'keeps the deck tile at its plate-row density along z', () => {
        const d = texelDensity( deck );
        expect( d.pxPerV / d.pxPerU ).toBeCloseTo( TEX_SPAN_X / TEX_SPAN_Z );
    } );

    it( 'lays the same pits for the same parameters', () => {
        expect( pitPlan( graphite ) ).toEqual( pitPlan( graphite ) );
    } );

    it( 'paints round pits in world units on either tile', () => {
        for ( const p of [ deck, graphite ] ) {
            const d = texelDensity( p );
            for ( const pit of pitPlan( p ).slice( 0, 20 ) ) {
                expect( pit.rx / d.pxPerU ).toBeCloseTo( pit.ry / d.pxPerV );
            }
        }
    } );

    it( 'lays pits by area, so the square tile holds more than the deck strip', () => {
        const ratio = pitPlan( graphite ).length / pitPlan( deck ).length;
        expect( ratio ).toBeCloseTo( TEX_SPAN_X / TEX_SPAN_Z, 1 );
    } );

    it( 'lays no pits at zero density', () => {
        expect( pitPlan( { ...graphite, pitDensity: 0 } ) ).toHaveLength( 0 );
    } );
} );

describe( 'wall UVs', () => {
    const p = [ 3, 5, 7 ] as const;

    it( 'maps every wall plane at one texel density', () => {
        for ( const plane of [ 'xz', 'zy', 'xy' ] as const ) {
            const [ u, v ] = uvFor( p, plane );
            const [ u2, v2 ] = uvFor( [ p[ 0 ] + 1, p[ 1 ] + 1, p[ 2 ] + 1 ], plane );
            expect( u2 - u ).toBeCloseTo( 1 / TEX_SPAN_X );
            expect( v2 - v ).toBeCloseTo( 1 / TEX_SPAN_X );
        }
    } );

    it( 'keeps the deck top on the plate-row span along z', () => {
        const [ , v ] = uvFor( [ 0, 0, TEX_SPAN_Z ], 'deck' );
        expect( v ).toBeCloseTo( 1 );
    } );
} );

describe( 'floor groups', () => {
    it( 'puts only the upward top face in the deck group', () => {
        const geo = buildSpanGeometry( -8, 8, 0, 16 );
        const n = geo.getAttribute( 'normal' );
        const top = geo.groups.find( ( g ) => g.materialIndex === FLOOR_TOP_GROUP );
        const side = geo.groups.find( ( g ) => g.materialIndex === FLOOR_SIDE_GROUP );
        if ( ! top || ! side ) throw new Error( 'floor groups missing' );
        for ( let i = top.start; i < top.start + top.count; i++ ) expect( n.getY( i ) ).toBeCloseTo( 1 );
        let up = 0;
        for ( let i = side.start; i < side.start + side.count; i++ ) if ( n.getY( i ) > 0.9 ) up++;
        expect( up ).toBe( 0 );
        expect( top.count + side.count ).toBe( n.count );
    } );
} );
