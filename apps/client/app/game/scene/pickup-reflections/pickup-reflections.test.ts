import { type Anchor, fullFloor, HALF_WIDTH, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { PICKUP_CLEAR_REACH } from './pickup-reflections.constants';
import { clearBox, deckInterval, placePickupEmitters, syncPickupEmitters } from './pickup-reflections.utils';

const LAYOUT: Anchor[] = [
    { id: 'a', kind: 'pickup', x: 3, y: 0, z: -40 },
    { id: 'b', kind: 'pickup', x: -5, y: 2, z: -90 },
];

function trackWithHole( holeZ0: number, holeZ1: number ): Track {
    const segmentAt = ( i: number ): Segment => {
        const z0 = i * SEG_LEN;
        const z1 = z0 + SEG_LEN;
        const floors = z0 >= holeZ0 && z1 <= holeZ1 ? [] : fullFloor( 0 );
        return { index: i, z0, z1, kind: floors.length ? 'plain' : 'gap', floors, blocks: [], isFinish: false };
    };
    return {
        finishZ: 2000,
        anchors: [],
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( Math.floor( z / SEG_LEN ) ),
    };
}

function trackWithCrack( crackZ0: number, crackZ1: number, halfGap: number ): Track {
    const segmentAt = ( i: number ): Segment => {
        const z0 = i * SEG_LEN;
        const z1 = z0 + SEG_LEN;
        const floors =
            z0 >= crackZ0 && z1 <= crackZ1
                ? [
                      { x0: -HALF_WIDTH, x1: -halfGap, y: 0 },
                      { x0: halfGap, x1: HALF_WIDTH, y: 0 },
                  ]
                : fullFloor( 0 );
        return { index: i, z0, z1, kind: 'plain', floors, blocks: [], isFinish: false };
    };
    return {
        finishZ: 2000,
        anchors: [],
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( Math.floor( z / SEG_LEN ) ),
    };
}

describe( 'pickup reflection emitters', () => {
    it( 'places each anchor as a live translation', () => {
        const m = new Float32Array( 32 ).fill( 7 );
        placePickupEmitters( m, LAYOUT, trackWithHole( -1e6, -1e6 ) );
        expect( [ m[ 0 ], m[ 12 ], m[ 13 ], m[ 14 ], m[ 15 ] ] ).toEqual( [ 1, 3, 0, -40, 1 ] );
        expect( [ m[ 16 ], m[ 28 ], m[ 29 ], m[ 30 ] ] ).toEqual( [ 1, -5, 2, -90 ] );
    } );

    it( 'measures the clear deck back and forward to the nearest hole', () => {
        const track = trackWithHole( 400, 440 );
        const pick = ( z: number ): Anchor => ( { id: 'p', kind: 'pickup', x: 0, y: 0, z } );
        expect( clearBox( track, pick( 470 ) ) ).toEqual( {
            x0: -HALF_WIDTH,
            x1: HALF_WIDTH,
            z0: 440,
            z1: 470 + PICKUP_CLEAR_REACH,
        } );
        expect( clearBox( track, pick( 370 ) ).z1 ).toBeCloseTo( 399.5, 5 );
    } );

    it( 'narrows the box to the deck strip beside a lengthwise crack', () => {
        const track = trackWithCrack( 400, 440, 4 );
        const box = clearBox( track, { id: 'p', kind: 'pickup', x: 16, y: 0, z: 470 } );
        expect( [ box.x0, box.x1 ] ).toEqual( [ 4, HALF_WIDTH ] );
        expect( box.z0 ).toBe( 470 - PICKUP_CLEAR_REACH );
    } );

    it( 'merges touching spans into one deck strip', () => {
        const seg: Segment = {
            index: 0,
            z0: 0,
            z1: SEG_LEN,
            kind: 'plain',
            floors: [
                { x0: 0, x1: 10, y: 0 },
                { x0: -10, x1: 0, y: 0 },
                { x0: 20, x1: 30, y: 0 },
            ],
            blocks: [],
            isFinish: false,
        };
        expect( deckInterval( seg, 5, 1, 0 ) ).toEqual( [ -10, 10 ] );
        expect( deckInterval( seg, 25, 1, 0 ) ).toEqual( [ 20, 30 ] );
        expect( deckInterval( seg, 15, 1, 0 ) ).toBeNull();
        expect( deckInterval( seg, 5, 1, 2 ) ).toBeNull();
    } );

    it( 'packs the clear box in the second matrix column', () => {
        const m = new Float32Array( 16 );
        placePickupEmitters( m, [ { id: 'c', kind: 'pickup', x: 0, y: 0, z: 470 } ], trackWithHole( 400, 440 ) );
        expect( [ m[ 4 ], m[ 5 ], m[ 6 ], m[ 7 ] ] ).toEqual( [
            -HALF_WIDTH,
            HALF_WIDTH,
            440,
            470 + PICKUP_CLEAR_REACH,
        ] );
    } );

    it( 'switches a taken pickup off and reports the change once', () => {
        const m = new Float32Array( 32 );
        placePickupEmitters( m, LAYOUT, trackWithHole( -1e6, -1e6 ) );
        const taken = new Set( [ 'b' ] );
        const isTaken = ( id: string ) => taken.has( id );
        expect( syncPickupEmitters( m, LAYOUT, isTaken ) ).toBe( true );
        expect( [ m[ 0 ], m[ 16 ] ] ).toEqual( [ 1, 0 ] );
        expect( syncPickupEmitters( m, LAYOUT, isTaken ) ).toBe( false );
        taken.clear();
        expect( syncPickupEmitters( m, LAYOUT, isTaken ) ).toBe( true );
        expect( m[ 16 ] ).toBe( 1 );
    } );
} );
