import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { ARCH_FRAME, type FrameConfig, frameParts, GATE_FRAME, legShape, lintelWidth } from './monolith-frame';
import { RAIL_OUTER } from './monolith-transforms';

const MIN_INNER_FACE = 56;

function innerFaces( frame: FrameConfig, height = frame.height ): number[] {
    return frameParts( frame, [ { z: 100, height } ] ).legs.map(
        ( t ) => Math.abs( t.position[ 0 ] ) - t.scale[ 0 ] / 2,
    );
}

describe.each( [
    [ 'GATE_FRAME', GATE_FRAME ],
    [ 'ARCH_FRAME', ARCH_FRAME ],
] )( '%s', ( _, frame ) => {
    it( 'stands both legs clear of the rails, the opening wide', () => {
        for ( const x of innerFaces( frame ) ) {
            expect( x ).toBeCloseTo( frame.opening / 2 );
            expect( x ).toBeGreaterThanOrEqual( MIN_INNER_FACE );
            expect( x ).toBeGreaterThan( RAIL_OUTER );
        }
    } );

    it( 'mirrors the legs across the track', () => {
        const [ left, right ] = frameParts( frame, [ { z: 40, height: frame.height } ] ).legs;
        expect( left.position[ 0 ] ).toBeCloseTo( -right.position[ 0 ] );
        expect( left.scale ).toEqual( right.scale );
    } );

    it( 'tops the legs with the lintel, flush to the frame height', () => {
        const parts = frameParts( frame, [ { z: 0, height: frame.height } ] );
        const leg = parts.legs[ 0 ];
        const lintel = parts.lintels[ 0 ];
        expect( leg.position[ 1 ] + leg.scale[ 1 ] / 2 ).toBeCloseTo( frame.height - frame.lintel );
        expect( lintel.position[ 1 ] - lintel.scale[ 1 ] / 2 ).toBeCloseTo( frame.height - frame.lintel );
        expect( lintel.position[ 1 ] + lintel.scale[ 1 ] / 2 ).toBeCloseTo( frame.height );
        expect( lintel.scale[ 0 ] ).toBe( lintelWidth( frame ) );
    } );

    it( 'runs the lintel past the outer face of each leg by the overhang', () => {
        const outer = frame.opening / 2 + frame.legWidth;
        expect( lintelWidth( frame ) / 2 - outer ).toBeCloseTo( frame.overhang );
    } );

    it( 'lays a seam on every leg', () => {
        const parts = frameParts( frame, [
            { z: 0, height: frame.height },
            { z: 500, height: frame.height },
        ] );
        expect( parts.legs ).toHaveLength( 4 );
        expect( parts.seams ).toHaveLength( 4 );
        expect( parts.lintels ).toHaveLength( 2 );
    } );
} );

describe( 'legShape', () => {
    it( 'is a pillar whose gap reaches from the rail to half the opening', () => {
        expect( legShape( ARCH_FRAME ).gap ).toBeCloseTo( ARCH_FRAME.opening / 2 - RAIL_OUTER );
        expect( RAIL_OUTER ).toBeGreaterThan( HALF_WIDTH );
    } );

    it( 'grows with a taller frame and keeps the lintel on top', () => {
        const tall = frameParts( ARCH_FRAME, [ { z: 0, height: 210 } ] );
        expect( tall.lintels[ 0 ].position[ 1 ] + ARCH_FRAME.lintel / 2 ).toBeCloseTo( 210 );
        expect( innerFaces( ARCH_FRAME, 210 )[ 0 ] ).toBeCloseTo( ARCH_FRAME.opening / 2 );
    } );
} );
