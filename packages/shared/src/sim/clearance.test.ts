import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    BLOCK_HEIGHT,
    type Block,
    type FloorSpan,
    HALF_WIDTH,
    MIN_LANE,
    openCenterX,
    passableCorridorWidth,
    SEG_LEN,
    type Segment,
} from '../index.js';

const Z0 = 200;
const Z1 = Z0 + SEG_LEN;

function block( x0: number, x1: number, z0: number, z1: number ): Block {
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0, z1 };
}

function makeSegment( blocks: Block[], floors?: FloorSpan[] ): Segment {
    return {
        index: Z0 / SEG_LEN,
        z0: Z0,
        z1: Z1,
        kind: 'block',
        floors: floors ?? [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks,
        isFinish: false,
    };
}

test( 'an empty segment is open across the full width', () => {
    assert.equal( passableCorridorWidth( makeSegment( [] ) ), 2 * HALF_WIDTH );
    assert.equal( openCenterX( makeSegment( [] ) ), 0 );
} );

test( 'a full-depth centred block is measured the same as before', () => {
    const seg = makeSegment( [ block( -HALF_WIDTH, 20, Z0 + 6, Z0 + 14 ) ] );
    assert.equal( passableCorridorWidth( seg ), 12 );
    assert.equal( openCenterX( seg ), 26 );
} );

test( 'a shallow block lying between the legacy row centres is still measured', () => {
    const seg = makeSegment( [ block( -HALF_WIDTH, 29, Z0 + 3, Z0 + 5 ) ] );
    assert.equal( passableCorridorWidth( seg ), 3 );
    assert.ok( passableCorridorWidth( seg ) < MIN_LANE, 'the sampler must see the pinch, not the open slices' );
} );

test( 'clearance is the worst slice in the segment, not the mid slice', () => {
    const seg = makeSegment( [ block( -HALF_WIDTH, 26, Z0, Z0 + 4 ), block( -26, HALF_WIDTH, Z0 + 16, Z1 ) ] );
    assert.equal( passableCorridorWidth( seg ), 6 );
} );

test( 'a block flush to one z-boundary is sampled, not skipped', () => {
    const front = makeSegment( [ block( -HALF_WIDTH, 28, Z0, Z0 + 2 ) ] );
    const back = makeSegment( [ block( -HALF_WIDTH, 28, Z1 - 2, Z1 ) ] );
    assert.equal( passableCorridorWidth( front ), 4 );
    assert.equal( passableCorridorWidth( back ), 4 );
} );

test( 'floors with a z-extent pinch the corridor to nothing where they stop', () => {
    const seg = makeSegment(
        [],
        [
            { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0, z0: Z0, z1: Z0 + 4 },
            { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0, z0: Z1 - 4, z1: Z1 },
        ],
    );
    assert.equal( passableCorridorWidth( seg ), 0 );
} );

test( 'the open centre avoids a lane that is blocked anywhere in the segment', () => {
    const seg = makeSegment( [ block( -HALF_WIDTH, -8, Z0, Z0 + 8 ) ] );
    assert.equal( openCenterX( seg ), 12 );
} );

test( 'the open centre falls back to the mid slice when no lane threads the whole segment', () => {
    const seg = makeSegment( [ block( -HALF_WIDTH, 0, Z0, Z0 + 8 ), block( 0, HALF_WIDTH, Z0 + 12, Z1 ) ] );
    assert.equal( openCenterX( seg ), 0 );
} );

test( 'the open centre is deterministic and inside the rails for varied depths', () => {
    const seg = makeSegment( [ block( -20, -12, Z0 + 1, Z0 + 5 ), block( 4, 12, Z0 + 11, Z0 + 19 ) ] );
    const x = openCenterX( seg );
    assert.equal( x, openCenterX( seg ) );
    assert.ok( Math.abs( x ) <= HALF_WIDTH );
    assert.equal( x, 22 );
} );
