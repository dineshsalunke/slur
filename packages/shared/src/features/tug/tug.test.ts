import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    BLOCK_HEIGHT,
    BLOCK_ID_STRIDE,
    type Block,
    DEFAULT_SIM_CONFIG,
    HALF_WIDTH,
    SEG_LEN,
    type Segment,
    spawnShip,
    type TargetShip,
    type Track,
} from '../../index.js';
import { blockAnchor, catapult, reel, throwSeconds, tugTarget } from './tug.js';

const cfg = DEFAULT_SIM_CONFIG;

function block( z0: number, x0: number, x1: number ): Block {
    const seg = Math.floor( z0 / SEG_LEN );
    const k = z0 - seg * SEG_LEN;
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0, z1: z0 + 8, id: seg * BLOCK_ID_STRIDE + k, kind: 'sealed' };
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

function ship( id: string, z: number, x = 0 ): TargetShip {
    return { id, x, y: 0, z, vz: 55, halfW: 1.3, halfL: 1.26, dead: false, spectating: false, finished: false };
}

const me = { x: 0, z: 200 };
const edge = HALF_WIDTH - 10;
const inBand = me.z + cfg.tugBlockMin + 20;

test( 'a rival in range wins over a block in the band', () => {
    const track = trackWith( [ block( inBand, edge - 4, edge ) ] );
    const got = tugTarget( me, 'me', [ ship( 'a', 300 ) ], track, new Set(), cfg );
    assert.deepEqual( got, { kind: 'rival', id: 'a' } );
} );

test( 'a rival past the tug range is ignored and the block in the band is taken', () => {
    const b = block( inBand, edge - 4, edge );
    const got = tugTarget( me, 'me', [ ship( 'a', me.z + cfg.tugRange + 5 ) ], trackWith( [ b ] ), new Set(), cfg );
    assert.deepEqual( got, { kind: 'block', x: b.x0, z: b.z0, id: b.id } );
} );

test( 'the anchor x sits inside the block span under the ship', () => {
    const b = block( inBand, -6, 6 );
    assert.deepEqual( blockAnchor( { x: 2, z: me.z }, trackWith( [ b ] ), new Set(), cfg ), {
        x: 2,
        z: b.z0,
        id: b.id,
    } );
} );

test( 'the nearest block in the band is taken and a broken one is skipped', () => {
    const near = block( inBand, -4, 4 );
    const far = block( inBand + 60, -4, 4 );
    const track = trackWith( [ far, near ] );
    assert.equal( blockAnchor( me, track, new Set(), cfg )?.z, near.z0 );
    assert.equal( blockAnchor( me, track, new Set( [ near.id ] ), cfg )?.z, far.z0 );
} );

test( 'a block nearer than the band, beyond it or behind the ship gives no anchor', () => {
    const behind = block( me.z - 20, -4, 4 );
    const tooNear = block( me.z + cfg.tugBlockMin - 10, -4, 4 );
    const beyond = block( me.z + cfg.tugBlockMax + 10, -4, 4 );
    const track = trackWith( [ behind, tooNear, beyond ] );
    assert.equal( blockAnchor( me, track, new Set(), cfg ), null );
    assert.equal( tugTarget( me, 'me', [], track, new Set(), cfg ), null );
} );

test( 'the band edges are anchors', () => {
    const min = block( me.z + cfg.tugBlockMin, -4, 4 );
    const max = block( me.z + cfg.tugBlockMax, -4, 4 );
    assert.equal( blockAnchor( me, trackWith( [ min ] ), new Set(), cfg )?.z, min.z0 );
    assert.equal( blockAnchor( me, trackWith( [ max ] ), new Set(), cfg )?.z, max.z0 );
} );

test( 'back fire latches a rival behind and never a block', () => {
    const track = trackWith( [ block( inBand, -4, 4 ) ] );
    assert.equal( tugTarget( me, 'me', [], track, new Set(), cfg, -1 ), null );
    assert.deepEqual( tugTarget( me, 'me', [ ship( 'b', 120 ) ], track, new Set(), cfg, -1 ), {
        kind: 'rival',
        id: 'b',
    } );
} );

test( 'the firer never latches itself', () => {
    assert.equal( tugTarget( me, 'me', [ ship( 'me', 250 ) ], trackWith( [] ), new Set(), cfg ), null );
} );

test( 'the throw time grows with the gap from the minimum to the maximum', () => {
    assert.equal( throwSeconds( 0, 150, cfg ), cfg.tugThrowMinS );
    assert.equal( throwSeconds( 150, 150, cfg ), cfg.tugThrowMaxS );
    assert.equal( throwSeconds( 900, 150, cfg ), cfg.tugThrowMaxS );
    assert.ok( Math.abs( throwSeconds( 75, 150, cfg ) - ( cfg.tugThrowMinS + cfg.tugThrowMaxS ) / 2 ) < 1e-12 );
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
