import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passableCorridorWidth } from './clearance.js';
import { abutAcrossBoundary, MERGE_POCKET_Z, mergeCloseBlocks } from './merge-blocks.js';
import {
    BLOCK_HEIGHT,
    type Block,
    type BlockKind,
    fullFloor,
    isHole,
    MIN_LANE,
    SEG_LEN,
    type Segment,
    START_SAFE,
    TRACK_SEGMENTS,
} from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 0x0fffffff, 42, 99991, 0xffffffff ];

function box( id: number, x0: number, x1: number, z0: number, z1: number, kind: BlockKind = 'sealed' ): Block {
    return { id, x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0, z1, kind };
}

function seg( index: number, blocks: Block[], floors = fullFloor( 0 ) ): Segment {
    const z0 = index * SEG_LEN;
    return { index, z0, z1: z0 + SEG_LEN, kind: 'block', floors, blocks, isFinish: false };
}

test( 'two blocks split by a hull-narrow slit become one block', () => {
    const out = mergeCloseBlocks( seg( 0, [ box( 5, -20, -12, 4, 12 ), box( 3, -10, -2, 6, 14 ) ] ) );
    assert.deepEqual( out, [ box( 3, -20, -2, 4, 14 ) ] );
} );

test( 'blocks a ship fits between are left apart', () => {
    const blocks = [ box( 0, -20, -12, 4, 12 ), box( 1, -6, 2, 4, 12 ) ];
    assert.deepEqual( mergeCloseBlocks( seg( 0, blocks ) ), blocks );
} );

test( 'a merge that would close the only corridor is refused', () => {
    const floors = [ { x0: -10, x1: 10, y: 0 } ];
    const blocks = [ box( 0, -10, -1, 4, 12 ), box( 1, 1, 10, 4, 12 ) ];
    assert.deepEqual( mergeCloseBlocks( seg( 0, blocks, floors ) ), blocks );
} );

test( 'a merged block keeps a fracture only while it fits the fracture cap', () => {
    const small = mergeCloseBlocks( seg( 0, [ box( 0, -10, -6, 4, 8, 'fractured' ), box( 1, -4, 0, 4, 8 ) ] ) );
    assert.equal( small[ 0 ].kind, 'fractured' );
    const big = mergeCloseBlocks( seg( 0, [ box( 0, -20, -12, 4, 8, 'fractured' ), box( 1, -10, 0, 4, 8 ) ] ) );
    assert.equal( big[ 0 ].kind, 'sealed' );
} );

test( 'a block with a close partner across the boundary grows to the segment edge', () => {
    const here = seg( 1, [ box( 64, -8, 0, 22, 38 ) ] );
    const next = [ box( 128, -4, 4, 40 + MERGE_POCKET_Z / 2, 50 ) ];
    const prev = [ box( 0, -6, 2, 4, 20 - MERGE_POCKET_Z / 2 ) ];
    const [ b ] = abutAcrossBoundary( here, prev, next );
    assert.equal( b.z0, 20 );
    assert.equal( b.z1, 40 );
} );

test( 'a partner a ship fits behind does not pull the block to the edge', () => {
    const here = seg( 1, [ box( 64, -8, 0, 22, 30 ) ] );
    const [ b ] = abutAcrossBoundary( here, [], [ box( 128, -4, 4, 30 + MERGE_POCKET_Z, 50 ) ] );
    assert.equal( b.z1, 30 );
} );

test( 'on the fairness seeds no segment is left with a pair it could still merge', () => {
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed ) );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const s = t.segmentAt( i );
            if ( isHole( s ) ) continue;
            assert.equal( mergeCloseBlocks( s ).length, s.blocks.length, `seed ${ seed } seg ${ i } still merges` );
            assert.ok( passableCorridorWidth( s ) >= MIN_LANE, `seed ${ seed } seg ${ i } corridor under MIN_LANE` );
        }
    }
} );
