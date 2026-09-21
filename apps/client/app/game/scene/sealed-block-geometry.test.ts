import { BLOCK_HEIGHT } from '@slur/shared';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { sealedBlockGeometry } from './sealed-block-geometry';

const FOOTPRINTS = [
    { w: 4, d: 8 },
    { w: 5.5, d: 5.5 },
    { w: 3.5, d: 5 },
];

const EPS = 1e-6;

describe( 'sealedBlockGeometry', () => {
    it.each( FOOTPRINTS )( 'keeps every vertex inside the $w x $d AABB', ( { w, d } ) => {
        const pos = sealedBlockGeometry( { w, h: BLOCK_HEIGHT, d } ).getAttribute( 'position' );

        for ( let i = 0; i < pos.count; i++ ) {
            expect( Math.abs( pos.getX( i ) ) ).toBeLessThanOrEqual( w / 2 + EPS );
            expect( Math.abs( pos.getY( i ) ) ).toBeLessThanOrEqual( BLOCK_HEIGHT / 2 + EPS );
            expect( Math.abs( pos.getZ( i ) ) ).toBeLessThanOrEqual( d / 2 + EPS );
        }
    } );

    it.each( FOOTPRINTS )( 'reaches the full $w x $d envelope on every axis', ( { w, d } ) => {
        const geometry = sealedBlockGeometry( { w, h: BLOCK_HEIGHT, d } );
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;

        expect( box ).not.toBeNull();
        expect( box?.max.x ).toBeCloseTo( w / 2 );
        expect( box?.max.y ).toBeCloseTo( BLOCK_HEIGHT / 2 );
        expect( box?.max.z ).toBeCloseTo( d / 2 );
        expect( box?.min.x ).toBeCloseTo( -w / 2 );
        expect( box?.min.y ).toBeCloseTo( -BLOCK_HEIGHT / 2 );
        expect( box?.min.z ).toBeCloseTo( -d / 2 );
    } );
} );

function triangles( w: number, d: number ) {
    const pos = sealedBlockGeometry( { w, h: BLOCK_HEIGHT, d } ).getAttribute( 'position' );
    const nrm = sealedBlockGeometry( { w, h: BLOCK_HEIGHT, d } ).getAttribute( 'normal' );
    const out = [];

    for ( let t = 0; t < pos.count; t += 3 ) {
        const p = [ 0, 1, 2 ].map( ( k ) => new Vector3().fromBufferAttribute( pos, t + k ) );
        const edge = p[ 1 ].clone().sub( p[ 0 ] ).cross( p[ 2 ].clone().sub( p[ 0 ] ) );
        out.push( {
            centroid: p[ 0 ]
                .clone()
                .add( p[ 1 ] )
                .add( p[ 2 ] )
                .multiplyScalar( 1 / 3 ),
            wound: edge.normalize(),
            stored: new Vector3().fromBufferAttribute( nrm, t ),
        } );
    }
    return out;
}

describe( 'chamfer', () => {
    it.each( FOOTPRINTS )( 'winds every facet to face outward on $w x $d', ( { w, d } ) => {
        for ( const tri of triangles( w, d ) ) {
            expect( tri.stored.dot( tri.centroid ) ).toBeGreaterThan( 0 );
            expect( tri.wound.dot( tri.stored ) ).toBeGreaterThan( 0.99 );
        }
    } );

    it( 'emits the full chamfered shell', () => {
        expect( triangles( 4, 8 ) ).toHaveLength( 6 * 2 + 12 * 2 + 8 );
        expect( sealedBlockGeometry( { w: 4, h: 8, d: 8 }, 0 ).getAttribute( 'position' ).count / 3 ).toBe( 12 );
    } );

    it( 'puts a facet on the -Z/-X vertical edge', () => {
        const lit = triangles( 4, 8 ).filter(
            ( t ) => t.stored.x < -0.7 && t.stored.z < -0.7 && Math.abs( t.stored.y ) < 1e-6,
        );
        expect( lit.length ).toBe( 2 );
        expect( lit[ 0 ].stored.x ).toBeCloseTo( -Math.SQRT1_2 );
        expect( lit[ 0 ].stored.z ).toBeCloseTo( -Math.SQRT1_2 );
    } );
} );
