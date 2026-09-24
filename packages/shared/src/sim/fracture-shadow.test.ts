import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_SHIP_WIDTH } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import {
    FRACTURE_SHADOW_PAD,
    FRACTURE_SHADOW_S,
    FRACTURE_SHADOW_SEGMENTS,
    FRACTURE_SHADOW_Z,
    sealShadowed,
    shadowHazard,
} from './fracture-shadow.js';
import {
    BLOCK_HEIGHT,
    type Block,
    type BlockKind,
    type FloorSpan,
    fullFloor,
    HALF_WIDTH,
    SEG_LEN,
    type Segment,
    TRACK_SEGMENTS,
} from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const SEEDS = [ 20260921, 1, 42, 7, 99991 ];

function box( id: number, x0: number, x1: number, z0: number, z1: number, kind: BlockKind = 'fractured' ): Block {
    return { id, x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0, z1, kind };
}

function seg( index: number, blocks: Block[], floors: FloorSpan[] = fullFloor( 0 ) ): Segment {
    const z0 = index * SEG_LEN;
    return { index, z0, z1: z0 + SEG_LEN, kind: 'block', floors, blocks, isFinish: false };
}

function kinds( blocks: Block[] ): Map< number, BlockKind > {
    return new Map( blocks.map( ( b ) => [ b.id, b.kind ] ) );
}

function lone( b: Block, ahead: Segment[] = [] ): BlockKind {
    return sealShadowed( seg( 10, [ b ] ), ahead )[ 0 ].kind;
}

test( 'the clear zone covers one second of post-smash travel for every class', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        assert.ok( c.tuning.smashKeep * c.tuning.maxCruise * FRACTURE_SHADOW_S <= FRACTURE_SHADOW_Z + 1e-9, c.id );
    }
    assert.equal( FRACTURE_SHADOW_PAD, MAX_SHIP_WIDTH / 2 );
    assert.equal( FRACTURE_SHADOW_SEGMENTS, Math.ceil( FRACTURE_SHADOW_Z / SEG_LEN ) );
} );

test( 'the clear zone is sized at the frozen register cruise, not the fastest class', () => {
    assert.ok( Math.abs( FRACTURE_SHADOW_Z - 55.8 ) < 1e-9, `${ FRACTURE_SHADOW_Z }` );
} );

test( 'a block right behind a fractured block seals it', () => {
    const b = box( 1, -2, 2, 204, 208 );
    const ahead = [ seg( 11, [ box( 2, 1, 5, 225, 230, 'sealed' ) ] ) ];
    assert.equal( lone( b, ahead ), 'sealed' );
    assert.equal( shadowHazard( b, [ seg( 10, [ b ] ), ...ahead ] ), 'block' );
} );

test( 'a block beside the shadow or past the clear zone leaves it fractured', () => {
    const b = box( 1, -2, 2, 204, 208 );
    const pad = FRACTURE_SHADOW_PAD;
    const beside = seg( 11, [ box( 2, 2 + pad, 8, 222, 228, 'sealed' ) ] );
    assert.equal( lone( b, [ beside ] ), 'fractured' );
    const farZ = 208 + FRACTURE_SHADOW_Z;
    const far = seg( Math.floor( farZ / SEG_LEN ), [ box( 2, -2, 2, farZ, farZ + 4, 'sealed' ) ] );
    assert.equal( lone( b, [ far ] ), 'fractured' );
} );

test( 'a block inside the hull pad seals it', () => {
    const b = box( 1, -2, 2, 204, 208 );
    const edge = seg( 11, [ box( 2, 2 + FRACTURE_SHADOW_PAD - 0.5, 8, 222, 228, 'sealed' ) ] );
    assert.equal( lone( b, [ edge ] ), 'sealed' );
} );

test( 'a floor gap in the shadow seals it; a gap outside the shadow does not', () => {
    const b = box( 1, -2, 2, 204, 208 );
    const under = seg(
        12,
        [],
        [
            { x0: -HALF_WIDTH, x1: -1, y: 0 },
            { x0: 1, x1: HALF_WIDTH, y: 0 },
        ],
    );
    assert.equal( lone( b, [ under ] ), 'sealed' );
    assert.equal( shadowHazard( b, [ seg( 10, [ b ] ), under ] ), 'gap' );
    const aside = seg(
        12,
        [],
        [
            { x0: -HALF_WIDTH, x1: 10, y: 0 },
            { x0: 14, x1: HALF_WIDTH, y: 0 },
        ],
    );
    assert.equal( lone( b, [ aside ] ), 'fractured' );
} );

test( 'the shadow stops at the track edge', () => {
    const b = box( 1, HALF_WIDTH - 4, HALF_WIDTH, 204, 208 );
    assert.equal( lone( b, [ seg( 11, [] ), seg( 12, [] ), seg( 13, [] ) ] ), 'fractured' );
} );

test( 'the pass changes only the kind of fractured blocks', () => {
    const blocks = [ box( 1, -2, 2, 204, 208 ), box( 2, -2, 2, 212, 216, 'sealed' ), box( 3, 20, 24, 204, 208 ) ];
    const out = sealShadowed( seg( 10, blocks ), [] );
    assert.deepEqual(
        out.map( ( { kind: _, ...rest } ) => rest ),
        blocks.map( ( { kind: _, ...rest } ) => rest ),
    );
    assert.deepEqual( [ ...kinds( out ).values() ], [ 'sealed', 'sealed', 'fractured' ] );
} );

test( 'the result does not depend on block order', () => {
    const blocks = [
        box( 1, -2, 2, 202, 206 ),
        box( 2, -2, 2, 210, 214 ),
        box( 3, -2, 2, 218, 219, 'sealed' ),
        box( 4, 12, 16, 202, 206 ),
    ];
    const forward = kinds( sealShadowed( seg( 10, blocks ), [] ) );
    const reverse = kinds( sealShadowed( seg( 10, [ ...blocks ].reverse() ), [] ) );
    assert.deepEqual( reverse, forward );
    assert.equal( forward.get( 1 ), 'sealed' );
    assert.equal( forward.get( 2 ), 'sealed' );
    assert.equal( forward.get( 4 ), 'fractured' );
} );

test( 'on procgen tracks, no fractured block keeps a hazard in its shadow after the pass', () => {
    for ( const seed of SEEDS ) {
        const track = resolveTrack( procgenDescriptor( seed ) );
        const memo = new Map< number, Segment >();
        const at = ( i: number ): Segment => {
            const hit = memo.get( i );
            if ( hit !== undefined ) return hit;
            const s = track.segmentAt( i );
            memo.set( i, s );
            return s;
        };
        const ahead = ( i: number ): Segment[] =>
            Array.from( { length: FRACTURE_SHADOW_SEGMENTS }, ( _, p ) => at( i + 1 + p ) );
        let before = 0;
        let after = 0;
        for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
            const out = { ...at( i ), blocks: sealShadowed( at( i ), ahead( i ) ) };
            before += at( i ).blocks.filter( ( b ) => b.kind === 'fractured' ).length;
            for ( const b of out.blocks ) {
                if ( b.kind !== 'fractured' ) continue;
                after++;
                assert.equal( shadowHazard( b, [ out, ...ahead( i ) ] ), null, `seed ${ seed } block ${ b.id }` );
            }
        }
        assert.ok( after > 0 && after <= before, `seed ${ seed }: ${ after } of ${ before } stay fractured` );
    }
} );
