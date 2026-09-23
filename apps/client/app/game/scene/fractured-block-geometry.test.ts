import { describe, expect, it } from 'vitest';
import {
    cellVolume,
    FRACTURE_ORIENTS,
    FRACTURE_OUTER,
    FRACTURE_WALL,
    fractureCells,
    fracturedBlockGeometry,
    fractureOrient,
    fractureSeeds,
} from './fractured-block-geometry';

describe( 'fractured block geometry', () => {
    it( 'splits the block into about twelve cells', () => {
        expect( fractureCells() ).toHaveLength( 12 );
    } );

    it( 'tiles the unit box with no overlap and no hole', () => {
        const total = fractureCells().reduce( ( sum, c ) => sum + cellVolume( c ), 0 );
        expect( total ).toBeCloseTo( 1, 6 );
        for ( const c of fractureCells() ) expect( cellVolume( c ) ).toBeGreaterThan( 0.02 );
    } );

    it( 'keeps every cell convex', () => {
        for ( const c of fractureCells() ) {
            for ( const f of c.faces ) {
                const d = f.normal.dot( f.points[ 0 ] );
                for ( const other of c.faces ) {
                    for ( const p of other.points ) expect( f.normal.dot( p ) - d ).toBeLessThan( 1e-6 );
                }
            }
        }
    } );

    it( 'stays inside the unit box', () => {
        const pos = fracturedBlockGeometry().getAttribute( 'position' );
        for ( let i = 0; i < pos.count; i++ ) {
            expect( Math.abs( pos.getX( i ) ) ).toBeLessThanOrEqual( 0.5 + 1e-6 );
            expect( Math.abs( pos.getY( i ) ) ).toBeLessThanOrEqual( 0.5 + 1e-6 );
            expect( Math.abs( pos.getZ( i ) ) ).toBeLessThanOrEqual( 0.5 + 1e-6 );
        }
    } );

    it( 'shows several plates on every face, the top included', () => {
        for ( const axis of [ 'x', 'y', 'z' ] as const ) {
            for ( const s of [ -0.5, 0.5 ] ) {
                const plates = fractureCells().filter( ( c ) =>
                    c.faces.some( ( f ) => f.tag === FRACTURE_OUTER && f.points.every( ( p ) => p[ axis ] === s ) ),
                );
                expect( plates.length ).toBeGreaterThanOrEqual( 4 );
            }
        }
    } );

    it( 'tags only outer faces and crack walls', () => {
        const tags = new Set( fracturedBlockGeometry().getAttribute( 'aFracture' ).array );
        expect( [ ...tags ].sort() ).toEqual( [ FRACTURE_OUTER, FRACTURE_WALL ] );
    } );

    it( 'faces every triangle along its normal', () => {
        const g = fracturedBlockGeometry();
        const pos = g.getAttribute( 'position' );
        const nor = g.getAttribute( 'normal' );
        for ( let t = 0; t < pos.count; t += 3 ) {
            const ax = pos.getX( t + 1 ) - pos.getX( t );
            const ay = pos.getY( t + 1 ) - pos.getY( t );
            const az = pos.getZ( t + 1 ) - pos.getZ( t );
            const bx = pos.getX( t + 2 ) - pos.getX( t );
            const by = pos.getY( t + 2 ) - pos.getY( t );
            const bz = pos.getZ( t + 2 ) - pos.getZ( t );
            const dot =
                ( ay * bz - az * by ) * nor.getX( t ) +
                ( az * bx - ax * bz ) * nor.getY( t ) +
                ( ax * by - ay * bx ) * nor.getZ( t );
            expect( dot ).toBeGreaterThan( 0 );
        }
    } );

    it( 'stays under the triangle budget', () => {
        expect( fracturedBlockGeometry().getAttribute( 'position' ).count / 3 ).toBeLessThanOrEqual( 600 );
    } );

    it( 'builds the same fracture every time', () => {
        expect( fractureSeeds() ).toEqual( fractureSeeds() );
    } );

    it( 'picks every orientation from block ids', () => {
        const seen = new Set( Array.from( { length: 200 }, ( _, id ) => fractureOrient( id ) ) );
        expect( seen.size ).toBe( FRACTURE_ORIENTS );
    } );
} );
