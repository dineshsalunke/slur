import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { MonolithShapeConfig } from './monolith-config';
import { MONOLITH_SHAPES } from './monolith-config';
import type { MonolithPlacement } from './monolith-field';
import {
    bodySpan,
    bodyTransform,
    innerFaceX,
    placedShape,
    seamTransform,
    shapeAt,
    shapeProfile,
    taperAt,
} from './monolith-transforms';
import { RAIL_W } from './track-geometry';

const box = MONOLITH_SHAPES.box;
const obelisk = MONOLITH_SHAPES.obelisk;
const bevel = box.chamfer / 2;

function withSeam( shape: MonolithShapeConfig, seam: Partial< MonolithShapeConfig[ 'seam' ] > ): MonolithShapeConfig {
    return { ...shape, seam: { ...shape.seam, ...seam } };
}

function at( z: number, side: number ): MonolithPlacement {
    return { z, side, scaleW: 1, scaleH: 1, scaleD: 1, push: 0 };
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

describe( 'shapeAt', () => {
    it( 'is deterministic and uses every shape in the mix', () => {
        const seen = new Set< string >();
        for ( let z = 0; z < 4000; z += 137 ) {
            for ( const side of [ -1, 1 ] ) {
                const name = shapeAt( z, side, [ 'box', 'obelisk' ] );
                expect( shapeAt( z, side, [ 'box', 'obelisk' ] ) ).toBe( name );
                seen.add( name );
            }
        }
        expect( seen.size ).toBe( 2 );
    } );

    it( 'honours a single-shape mix', () => {
        expect( shapeAt( 999, -1, [ 'obelisk' ] ) ).toBe( 'obelisk' );
    } );
} );

describe( 'bodySpan', () => {
    it( 'is the height above plus the skirt below', () => {
        expect( bodySpan( box ) ).toBe( box.height + box.below );
    } );
} );

describe( 'placedShape', () => {
    const varied = { z: 0, side: 1, scaleW: 1.5, scaleH: 0.5, scaleD: 1.8, push: 12 };

    it( 'scales each axis independently and stands the monolith back off the rail', () => {
        const s = placedShape( box, varied );
        expect( s.width ).toBeCloseTo( box.width * 1.5 );
        expect( s.height ).toBeCloseTo( box.height * 0.5 );
        expect( s.depth ).toBeCloseTo( box.depth * 1.8 );
        expect( innerFaceX( s ) ).toBeCloseTo( innerFaceX( box ) + 12 );
    } );

    it( 'keeps the base buried, so a shorter monolith does not float', () => {
        const t = bodyTransform( placedShape( box, varied ), varied );
        expect( t.position[ 1 ] - t.scale[ 1 ] / 2 ).toBeCloseTo( -box.below );
        expect( t.position[ 1 ] + t.scale[ 1 ] / 2 ).toBeCloseTo( box.height * 0.5 );
    } );

    it( 'carries the seam onto the resized face', () => {
        const s = placedShape( box, varied );
        expect( seamTransform( s, varied ).position[ 0 ] ).toBeCloseTo( innerFaceX( s ) + bevel );
    } );

    it( 'leaves a neutral placement identical to the shape', () => {
        expect( placedShape( box, at( 0, 1 ) ) ).toEqual( box );
    } );
} );
