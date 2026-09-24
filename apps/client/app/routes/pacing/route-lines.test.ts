import { describe, expect, it } from 'vitest';
import { bandShapes, binRange, offsetPoints, stepPoints } from './route-lines';

describe( 'binRange', () => {
    it( 'takes the min and max of every series that covers a bin', () => {
        const range = binRange(
            [
                { k0: 0, values: [ 1, 2, 3, 4 ] },
                { k0: 2, values: [ 9, 0 ] },
            ],
            4,
            2,
        );
        expect( Array.from( range.lo ) ).toEqual( [ 1, 0 ] );
        expect( Array.from( range.hi ) ).toEqual( [ 2, 9 ] );
    } );

    it( 'drops samples outside the track and zeroes empty bins', () => {
        const range = binRange( [ { k0: -1, values: [ 7, 5 ] } ], 4, 2 );
        expect( Array.from( range.lo ) ).toEqual( [ 5, 0 ] );
        expect( Array.from( range.hi ) ).toEqual( [ 5, 0 ] );
    } );
} );

describe( 'stepPoints', () => {
    it( 'emits one flat step per run of equal values', () => {
        expect( stepPoints( [ 1, 1, 2 ], 1 ) ).toEqual( [
            [ 0, -1 ],
            [ 2, -1 ],
            [ 2, -2 ],
            [ 3, -2 ],
        ] );
    } );
} );

describe( 'offsetPoints', () => {
    it( 'places local samples at their global row centre', () => {
        expect( offsetPoints( [ 4, 6 ], 10, 2 ) ).toEqual( [
            [ 5.25, -4 ],
            [ 5.75, -6 ],
        ] );
    } );
} );

describe( 'bandShapes', () => {
    it( 'closes each chunk as top edge then bottom edge reversed', () => {
        const [ shape ] = bandShapes( { lo: Float32Array.of( 1 ), hi: Float32Array.of( 3 ) }, 1 );
        expect( shape.points ).toBe( '0.000,-3.000 1.000,-3.000 1.000,-1.000 0.000,-1.000' );
    } );
} );
