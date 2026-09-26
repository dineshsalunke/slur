import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    BLOCK_HEIGHT,
    BLOCK_ID_STRIDE,
    type Block,
    blockAnchor,
    catapult,
    DEFAULT_SIM_CONFIG,
    HALF_WIDTH,
    reel,
    SEG_LEN,
    type SeekerShip,
    type Segment,
    spawnShip,
    type Track,
    tugTarget,
} from '../index.js';

const cfg = DEFAULT_SIM_CONFIG;

function block( seg: number, x0: number, x1: number, k = 0 ): Block {
    return {
        x0,
        x1,
        y0: 0,
        y1: BLOCK_HEIGHT,
        z0: seg * SEG_LEN + k,
        z1: seg * SEG_LEN + k + 8,
        id: seg * BLOCK_ID_STRIDE + k,
        kind: 'sealed',
    };
}

function trackWith( blocks: Block[] ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'block',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: blocks.filter( ( b ) => Math.floor( b.z0 / SEG_LEN ) === i ),
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function ship( id: string, z: number, x = 0 ): SeekerShip {
    return { id, x, y: 0, z, vz: 55, halfW: 1.3, halfL: 1.26, dead: false, spectating: false, finished: false };
}

const me = { x: 0, z: 200 };
const edge = HALF_WIDTH - 10;

test( 'a rival in range wins over a nearer block', () => {
    const track = trackWith( [ block( 11, edge - 4, edge ) ] );
    const got = tugTarget( me, 'me', [ ship( 'a', 300 ) ], track, new Set(), cfg );
    assert.deepEqual( got, { kind: 'rival', id: 'a' } );
} );

test( 'a rival past the tug range is ignored and the block ahead is taken', () => {
    const b = block( 12, edge - 4, edge );
    const got = tugTarget( me, 'me', [ ship( 'a', me.z + cfg.tugRange + 5 ) ], trackWith( [ b ] ), new Set(), cfg );
    assert.deepEqual( got, { kind: 'block', x: b.x0, z: b.z0 } );
} );

test( 'the anchor x sits inside the block span under the ship', () => {
    const b = block( 12, -6, 6 );
    assert.deepEqual( blockAnchor( { x: 2, z: me.z }, trackWith( [ b ] ), new Set(), cfg ), { x: 2, z: b.z0 } );
} );

test( 'the nearest block ahead is taken and a broken one is skipped', () => {
    const near = block( 11, -4, 4 );
    const far = block( 13, -4, 4 );
    const track = trackWith( [ far, near ] );
    assert.equal( blockAnchor( me, track, new Set(), cfg )?.z, near.z0 );
    assert.equal( blockAnchor( me, track, new Set( [ near.id ] ), cfg )?.z, far.z0 );
} );

test( 'a block beyond the tug range or behind the ship gives no anchor', () => {
    const behind = block( 9, -4, 4 );
    const beyond = block( Math.ceil( ( me.z + cfg.tugRange ) / SEG_LEN ) + 1, -4, 4 );
    assert.equal( blockAnchor( me, trackWith( [ behind, beyond ] ), new Set(), cfg ), null );
    assert.equal( tugTarget( me, 'me', [], trackWith( [ behind, beyond ] ), new Set(), cfg ), null );
} );

test( 'back fire latches a rival behind and never a block', () => {
    const track = trackWith( [ block( 11, -4, 4 ) ] );
    assert.equal( tugTarget( me, 'me', [], track, new Set(), cfg, -1 ), null );
    assert.deepEqual( tugTarget( me, 'me', [ ship( 'b', 120 ) ], track, new Set(), cfg, -1 ), {
        kind: 'rival',
        id: 'b',
    } );
} );

test( 'the firer never latches itself', () => {
    assert.equal( tugTarget( me, 'me', [ ship( 'me', 250 ) ], trackWith( [] ), new Set(), cfg ), null );
} );

test( 'catapult clears a stale anchor and reel sets one', () => {
    const s = spawnShip();
    reel( s, 400, cfg );
    assert.equal( s.tugAnchorZ, 400 );
    assert.equal( s.tugTimer, cfg.tugS );
    catapult( s, cfg );
    assert.equal( s.tugAnchorZ, 0 );
    assert.equal( s.vz, cfg.tugKick * 2 );
} );
