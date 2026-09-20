import { BLOCK_HEIGHT } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { sealedBlockGeometry } from './sealed-block-geometry';

// The three legal footprints the family is built on: today's generated block, plus GDD §0's two examples.
const FOOTPRINTS = [
    { w: 4, d: 8 },
    { w: 5.5, d: 5.5 },
    { w: 3.5, d: 5 },
];

const EPS = 1e-6;

describe( 'sealedBlockGeometry', () => {
    // The mesh IS the physics hull: a vertex outside the AABB kills the player on apparent empty air, and a
    // hull the art never fills makes solid mass look passable. Asserted, never eyeballed.
    it.each( FOOTPRINTS )( 'keeps every vertex inside the $w x $d AABB', ( { w, d } ) => {
        const pos = sealedBlockGeometry( { w, h: BLOCK_HEIGHT, d } ).getAttribute( 'position' );

        for ( let i = 0; i < pos.count; i++ ) {
            expect( Math.abs( pos.getX( i ) ) ).toBeLessThanOrEqual( w / 2 + EPS );
            expect( Math.abs( pos.getY( i ) ) ).toBeLessThanOrEqual( BLOCK_HEIGHT / 2 + EPS );
            expect( Math.abs( pos.getZ( i ) ) ).toBeLessThanOrEqual( d / 2 + EPS );
        }
    } );

    // Filling the hull is the other half: a block drawn short enough to look hoppable is a gameplay lie.
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
