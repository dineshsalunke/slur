import { describe, expect, it } from 'vitest';
import {
    FRACTURE_CORE,
    FRACTURE_OUTER,
    FRACTURE_WALL,
    fracturedBlockGeometry,
    fracturedChunks,
    fracturedDebrisPieces,
    outlineArea,
} from './fractured-block-geometry';

describe( 'fractured block geometry', () => {
    it( 'winds every outline counter-clockwise', () => {
        const { left, right, core } = fracturedChunks();
        for ( const chunk of [ left, right, core ] ) expect( outlineArea( chunk.outline ) ).toBeGreaterThan( 0 );
    } );

    it( 'stays inside the unit box', () => {
        const pos = fracturedBlockGeometry().getAttribute( 'position' );
        for ( let i = 0; i < pos.count; i++ ) {
            expect( Math.abs( pos.getX( i ) ) ).toBeLessThanOrEqual( 0.5 );
            expect( Math.abs( pos.getY( i ) ) ).toBeLessThanOrEqual( 0.5 );
            expect( Math.abs( pos.getZ( i ) ) ).toBeLessThanOrEqual( 0.5 );
        }
    } );

    it( 'breaks the top contour with an open notch', () => {
        const { left, right } = fracturedChunks();
        const leftTop = Math.max( ...left.outline.filter( ( p ) => p.y === 0.5 ).map( ( p ) => p.x ) );
        const rightTop = Math.min( ...right.outline.filter( ( p ) => p.y === 0.5 ).map( ( p ) => p.x ) );
        expect( rightTop - leftTop ).toBeGreaterThan( 0.4 );
    } );

    it( 'recesses the core below the top and inside the faces', () => {
        const { core } = fracturedChunks();
        expect( Math.max( ...core.outline.map( ( p ) => p.y ) ) ).toBeLessThan( 0.5 );
        expect( core.depth ).toBeLessThan( 1 );
    } );

    it( 'tags only outer, wall and core faces', () => {
        const tags = new Set( fracturedBlockGeometry().getAttribute( 'aFracture' ).array );
        const want = [ FRACTURE_OUTER, FRACTURE_WALL, FRACTURE_CORE ].map( Math.fround );
        expect( [ ...tags ].sort() ).toEqual( want.sort() );
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

    it( 'centres each debris piece on its own outline', () => {
        const pieces = fracturedDebrisPieces();
        expect( pieces ).toHaveLength( 2 );
        expect( pieces[ 0 ].centre.x ).toBeLessThan( 0 );
        expect( pieces[ 1 ].centre.x ).toBeGreaterThan( 0 );
    } );
} );
