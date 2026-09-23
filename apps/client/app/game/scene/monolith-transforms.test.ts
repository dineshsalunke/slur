import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { MonolithShapeConfig } from './monolith-config';
import { PILLAR } from './monolith-config';
import type { MonolithPlacement } from './monolith-field';
import { bodySpan, bodyTransform, innerFaceX, seamTransform, shapeProfile, taperAt } from './monolith-transforms';
import { RAIL_W } from './track-geometry';

const box = PILLAR;
const obelisk: MonolithShapeConfig = { ...PILLAR, taper: 0.62 };
const bevel = box.chamfer / 2;

function withSeam( shape: MonolithShapeConfig, seam: Partial< MonolithShapeConfig[ 'seam' ] > ): MonolithShapeConfig {
    return { ...shape, seam: { ...shape.seam, ...seam } };
}

function at( z: number, side: number ): MonolithPlacement {
    return { z, side };
}

describe( 'bodyTransform', () => {
    it( 'clears the rail on both sides', () => {
        for ( const side of [ -1, 1 ] ) {
            const t = bodyTransform( box, at( 100, side ) );
            expect( Math.abs( t.position[ 0 ] ) - box.width / 2 ).toBeCloseTo( HALF_WIDTH + RAIL_W );
            expect( Math.sign( t.position[ 0 ] ) ).toBe( side );
        }
    } );

    it( 'spans from below the floor to the full height', () => {
        const t = bodyTransform( box, at( 0, 1 ) );
        expect( t.position[ 1 ] + t.scale[ 1 ] / 2 ).toBeCloseTo( box.height );
        expect( t.position[ 1 ] - t.scale[ 1 ] / 2 ).toBeCloseTo( -box.below );
    } );

    it( 'mirrors a pair exactly across the track', () => {
        const right = bodyTransform( box, at( 300, 1 ) );
        const left = bodyTransform( box, at( 300, -1 ) );
        expect( left.position ).toEqual( [ -right.position[ 0 ], right.position[ 1 ], right.position[ 2 ] ] );
        expect( left.scale ).toEqual( right.scale );
    } );
} );

describe( 'PILLAR', () => {
    it( 'is a square 12u footprint, 50u tall, untapered', () => {
        expect( PILLAR.width ).toBe( 12 );
        expect( PILLAR.depth ).toBe( 12 );
        expect( PILLAR.height ).toBe( 50 );
        expect( PILLAR.taper ).toBe( 1 );
        expect( PILLAR.gap ).toBe( 0 );
    } );
} );

describe( 'taperAt', () => {
    it( 'is full width at the bottom and tapered at the top', () => {
        expect( taperAt( obelisk, -obelisk.below ) ).toBeCloseTo( 1 );
        expect( taperAt( obelisk, obelisk.height ) ).toBeCloseTo( obelisk.taper );
        expect( taperAt( box, box.height ) ).toBeCloseTo( 1 );
    } );
} );

describe( 'shapeProfile', () => {
    it( 'expresses the chamfer as a fraction of each axis', () => {
        const profile = shapeProfile( { ...box, width: 10, depth: 20, chamfer: 1 } );
        expect( profile.chamferX ).toBeCloseTo( 0.1 );
        expect( profile.chamferZ ).toBeCloseTo( 0.05 );
    } );
} );

describe( 'seamTransform', () => {
    it( 'sits on the chamfer of the inner face, toward the track', () => {
        const t = seamTransform( box, at( 0, 1 ) );
        expect( t.position[ 0 ] ).toBeCloseTo( innerFaceX( box ) + bevel );
    } );

    it( 'sits on the outer face when asked', () => {
        const t = seamTransform( withSeam( box, { face: 'outer' } ), at( 0, 1 ) );
        expect( t.position[ 0 ] ).toBeCloseTo( innerFaceX( box ) + box.width - bevel );
    } );

    it( 'centers on the face, or rides the near or far chamfer', () => {
        const edge = box.depth / 2 - bevel;
        expect( seamTransform( withSeam( box, { align: 'center' } ), at( 500, 1 ) ).position[ 2 ] ).toBe( 500 );
        expect( seamTransform( withSeam( box, { align: 'near' } ), at( 500, 1 ) ).position[ 2 ] ).toBeCloseTo(
            500 - edge,
        );
        expect( seamTransform( withSeam( box, { align: 'far' } ), at( 500, 1 ) ).position[ 2 ] ).toBeCloseTo(
            500 + edge,
        );
    } );

    it( 'faces the chamfer diagonal, and squares up mid-face', () => {
        const near = seamTransform( box, at( 0, 1 ) );
        const out = [ Math.cos( near.rotationY ), -Math.sin( near.rotationY ) ];
        expect( out[ 0 ] ).toBeCloseTo( -Math.SQRT1_2 );
        expect( out[ 1 ] ).toBeCloseTo( -Math.SQRT1_2 );
        expect( seamTransform( withSeam( box, { align: 'center' } ), at( 0, 1 ) ).rotationY ).toBe( 0 );
    } );

    it( 'mirrors the diagonal on the far side of the track', () => {
        const right = seamTransform( box, at( 0, 1 ) );
        const left = seamTransform( box, at( 0, -1 ) );
        expect( Math.cos( left.rotationY ) ).toBeCloseTo( -Math.cos( right.rotationY ) );
        expect( Math.sin( left.rotationY ) ).toBeCloseTo( Math.sin( right.rotationY ) );
    } );

    it( 'stands from the floor to the top of the monolith', () => {
        const t = seamTransform( box, at( 0, 1 ) );
        expect( t.position[ 1 ] ).toBeCloseTo( box.height / 2 );
        expect( t.scale[ 1 ] ).toBeCloseTo( box.height );
        expect( t.rotationZ ).toBeCloseTo( 0 );
    } );

    it( 'leans with the taper, mirrored per side', () => {
        const right = seamTransform( obelisk, at( 0, 1 ) );
        const left = seamTransform( obelisk, at( 0, -1 ) );
        expect( right.rotationZ ).not.toBeCloseTo( 0 );
        expect( left.rotationZ ).toBeCloseTo( -right.rotationZ );
        expect( right.scale[ 1 ] ).toBeGreaterThan( obelisk.height );
    } );

    it( 'tracks the tapered face rather than the base face', () => {
        const t = seamTransform( obelisk, at( 0, 1 ) );
        expect( t.position[ 0 ] ).toBeGreaterThan( innerFaceX( obelisk ) );
        expect( t.position[ 0 ] ).toBeLessThan( innerFaceX( obelisk ) + obelisk.width / 2 );
    } );
} );

describe( 'bodySpan', () => {
    it( 'is the height above plus the skirt below', () => {
        expect( bodySpan( box ) ).toBe( box.height + box.below );
    } );
} );
