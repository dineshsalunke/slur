import { describe, expect, it } from 'vitest';
import { FLOOR_SIDE_GROUP, FLOOR_TOP_GROUP } from './track-floor/track-floor.constants';
import { buildSpanGeometry } from './track-floor/track-floor.utils';
import { uvFor } from './track-geometry';
import {
    applyWear,
    blotchField,
    type SurfaceParams,
    scratchPlan,
    TEX_SPAN_X,
    TEX_SPAN_Z,
    texelDensity,
    tileSpanU,
} from './track-texture';

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
    scratchDensity: 3,
    scratchLift: 0.35,
    scratchTilt: 0.15,
    blotchDark: 0.3,
    blotchBright: 0.15,
    bakedBlotches: false,
    wearValueSpan: 0.3,
    wearRoughSpan: 0.25,
    wearMetalMin: 0.7,
    wearMetalMax: 1,
};
const graphite: SurfaceParams = { ...deck, joints: false, bakedBlotches: true };

describe( 'wear', () => {
    const base = [ 0x4a, 0x4d, 0x52 ];
    const run = ( values: number[], joints: number[] ) => {
        const albedo = new Uint8ClampedArray( values.flatMap( ( f ) => [ ...base.map( ( n ) => n * f ), 255 ] ) );
        const mask = new Uint8ClampedArray( joints.flatMap( ( j ) => [ j, j, j, 255 ] ) );
        const packed = new Uint8ClampedArray( values.flatMap( () => [ 255, 204, 255, 255 ] ) );
        applyWear( deck, albedo, mask, packed );
        return packed;
    };

    it( 'makes a brighter pixel smoother and more metallic than a darker one', () => {
        const out = run( [ 0.8, 1.2 ], [ 0, 0 ] );
        expect( out[ 5 ] ).toBeLessThan( out[ 1 ] );
        expect( out[ 6 ] ).toBeGreaterThan( out[ 2 ] );
    } );

    it( 'leaves the base value at its painted roughness', () => {
        expect( run( [ 1 ], [ 0 ] )[ 1 ] ).toBe( 204 );
    } );

    it( 'leaves joint pixels unchanged', () => {
        const out = run( [ 0 ], [ 255 ] );
        expect( [ out[ 1 ], out[ 2 ] ] ).toEqual( [ 204, 255 ] );
    } );

    it( 'keeps metalness between the wear bounds', () => {
        const out = run( [ 0, 0.5, 1, 1.5, 3 ], [ 0, 0, 0, 0, 0 ] );
        for ( let i = 2; i < out.length; i += 4 ) {
            expect( out[ i ] ).toBeGreaterThanOrEqual( Math.round( deck.wearMetalMin * 255 ) );
            expect( out[ i ] ).toBeLessThanOrEqual( Math.round( deck.wearMetalMax * 255 ) );
        }
    } );
} );

describe( 'graphite surface', () => {
    it( 'paints the jointless tile at the same texel density on both axes', () => {
        const d = texelDensity( graphite );
        expect( d.pxPerV ).toBe( d.pxPerU );
    } );

    it( 'keeps the deck tile at its plate-row density along z', () => {
        const d = texelDensity( deck );
        expect( d.pxPerV / d.pxPerU ).toBeCloseTo( TEX_SPAN_X / TEX_SPAN_Z );
    } );
} );

describe( 'scratch field', () => {
    it( 'lays the same scratches for the same parameters', () => {
        expect( scratchPlan( graphite ) ).toEqual( scratchPlan( graphite ) );
    } );

    it( 'lays scratches by area, so the square tile holds more than the deck strip', () => {
        const ratio = scratchPlan( graphite ).length / scratchPlan( deck ).length;
        expect( ratio ).toBeCloseTo( TEX_SPAN_X / TEX_SPAN_Z, 1 );
    } );

    it( 'places every scratch inside the tile in world units', () => {
        for ( const p of [ deck, graphite ] ) {
            const span = tileSpanU( p );
            for ( const s of scratchPlan( p ) ) {
                expect( s.x ).toBeLessThan( span.x );
                expect( s.y ).toBeLessThan( span.y );
            }
        }
    } );

    it( 'scatters scratches over every direction, not one brush line', () => {
        const angles = scratchPlan( graphite ).map( ( s ) => s.angle );
        const quarters = [ 0, 1, 2, 3 ].map(
            ( q ) => angles.filter( ( a ) => Math.floor( a / ( Math.PI / 4 ) ) === q ).length,
        );
        for ( const n of quarters ) expect( n / angles.length ).toBeGreaterThan( 0.2 );
    } );

    it( 'makes short scratches outnumber long ones', () => {
        const lengths = scratchPlan( graphite ).map( ( s ) => s.length );
        const short = lengths.filter( ( l ) => l < 0.6 ).length;
        expect( short / lengths.length ).toBeGreaterThan( 0.5 );
    } );

    it( 'mixes dark blotches with a smaller share of bright ones', () => {
        const f = blotchField( graphite );
        const dark = f.filter( ( v ) => v > 0.05 ).length / f.length;
        const bright = f.filter( ( v ) => v < -0.05 ).length / f.length;
        expect( dark ).toBeGreaterThan( 0.1 );
        expect( dark ).toBeLessThan( 0.35 );
        expect( bright ).toBeGreaterThan( 0.02 );
        expect( bright ).toBeLessThan( dark );
    } );

    it( 'lays no scratches at zero density', () => {
        expect( scratchPlan( { ...graphite, scratchDensity: 0 } ) ).toHaveLength( 0 );
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
