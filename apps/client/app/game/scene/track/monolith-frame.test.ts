import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { monolithLayout } from './arch-field';
import { PILLAR, PILLAR_FIELD } from './monolith-config';
import {
    ARCH_FRAME,
    type FrameConfig,
    frameParts,
    GATE_FRAME,
    legShape,
    lintelWidth,
    outlineStrips,
} from './monolith-frame';
import { bodyTransform, RAIL_OUTER } from './monolith-transforms';

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

describe( 'ARCH_FRAME', () => {
    it( 'keeps the 112u opening with bulky 32u legs', () => {
        expect( ARCH_FRAME.opening ).toBe( 112 );
        expect( ARCH_FRAME.legWidth ).toBe( 32 );
        expect( ARCH_FRAME.depth ).toBe( 32 );
    } );

    it( 'leaves no pillar piercing an arch leg', () => {
        const layout = monolithLayout( 8400, PILLAR_FIELD );
        const legs = frameParts( ARCH_FRAME, layout.arches ).legs;
        for ( const pillar of layout.pillars.map( ( p ) => bodyTransform( PILLAR, p ) ) ) {
            for ( const leg of legs ) {
                const overlapX =
                    Math.abs( pillar.position[ 0 ] - leg.position[ 0 ] ) < ( pillar.scale[ 0 ] + leg.scale[ 0 ] ) / 2;
                const overlapZ =
                    Math.abs( pillar.position[ 2 ] - leg.position[ 2 ] ) < ( pillar.scale[ 2 ] + leg.scale[ 2 ] ) / 2;
                expect( overlapX && overlapZ ).toBe( false );
            }
        }
    } );
} );

describe( 'GATE_FRAME', () => {
    it( 'stands taller and heavier than every arch', () => {
        const layout = monolithLayout( 8400, PILLAR_FIELD );
        for ( const arch of layout.arches ) expect( GATE_FRAME.height ).toBeGreaterThan( arch.height );
        expect( GATE_FRAME.legWidth ).toBeGreaterThan( ARCH_FRAME.legWidth );
        expect( GATE_FRAME.depth ).toBeGreaterThan( ARCH_FRAME.depth );
        expect( GATE_FRAME.lintel ).toBeGreaterThan( ARCH_FRAME.lintel );
    } );
} );

describe( 'outlineStrips', () => {
    const placement = { z: 900, height: GATE_FRAME.height };
    const [ left, right, lintel ] = outlineStrips( GATE_FRAME, placement, 4, 0.5 );

    it( 'lines both inner leg faces from the deck to the lintel', () => {
        for ( const leg of [ left, right ] ) {
            expect( Math.abs( leg.position[ 0 ] ) + leg.scale[ 0 ] / 2 ).toBeCloseTo( GATE_FRAME.opening / 2 );
            expect( leg.position[ 1 ] - leg.scale[ 1 ] / 2 ).toBeCloseTo( 0 );
            expect( leg.position[ 1 ] + leg.scale[ 1 ] / 2 ).toBeCloseTo( GATE_FRAME.height - GATE_FRAME.lintel );
        }
        expect( left.position[ 0 ] ).toBeCloseTo( -right.position[ 0 ] );
    } );

    it( 'lines the lintel underside across the whole opening', () => {
        expect( lintel.scale[ 0 ] ).toBe( GATE_FRAME.opening );
        expect( lintel.position[ 1 ] + lintel.scale[ 1 ] / 2 ).toBeCloseTo( GATE_FRAME.height - GATE_FRAME.lintel );
    } );

    it( 'centres every strip on the gate, the given width along the track', () => {
        for ( const s of [ left, right, lintel ] ) {
            expect( s.position[ 2 ] ).toBe( 900 );
            expect( s.scale[ 2 ] ).toBe( 4 );
        }
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
