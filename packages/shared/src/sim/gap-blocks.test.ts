import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    isFullSpan,
    isHole,
    MIN_LANE,
    passableCorridorWidth,
    procgenDescriptor,
    resolveTrack,
    SEG_LEN,
    type Segment,
    START_SAFE,
    TRACK_SEGMENTS,
    type Track,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 99991, 7 ];

function gapSegments( t: Track ): Segment[] {
    const out: Segment[] = [];
    for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
        const s = t.segmentAt( i );
        if ( s.kind === 'gap' ) out.push( s );
    }
    return out;
}

test( 'gaps and blocks now co-occur on the same segment', () => {
    let carrying = 0;
    let total = 0;
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed ) ) ) ) {
            total++;
            if ( s.blocks.length > 0 ) carrying++;
        }
    }
    assert.ok( total > 0, 'no gap segments generated' );
    assert.ok( carrying > 0, 'no gap segment carries a block — the two verbs still never overlap' );
} );

test( 'a full-width gap never carries a block, because there is nothing to stand on', () => {
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed ) ) ) ) {
            if ( ! isHole( s ) ) continue;
            assert.equal( s.blocks.length, 0, `seed ${ seed } seg ${ s.index }: a block floating over a full gap` );
        }
    }
} );

test( 'a gap block sits on a full-span deck and on the landing side of the segment', () => {
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed ) ) ) ) {
            for ( const b of s.blocks ) {
                assert.ok(
                    b.z0 >= s.z0 + SEG_LEN / 2 - 1e-6,
                    `seed ${ seed } seg ${ s.index }: block before mid-segment`,
                );
                assert.ok( b.z1 <= s.z1 + 1e-6, `seed ${ seed } seg ${ s.index }: block outruns the segment` );
                const decks = s.floors.filter( isFullSpan );
                assert.ok(
                    decks.some( ( f ) => b.x0 >= f.x0 - 1e-6 && b.x1 <= f.x1 + 1e-6 ),
                    `seed ${ seed } seg ${ s.index }: block hangs over the hole`,
                );
            }
        }
    }
} );

test( 'the combined gap-plus-block result still clears MIN_LANE at every slice', () => {
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed ) ) ) ) {
            if ( isHole( s ) ) continue;
            assert.ok(
                passableCorridorWidth( s ) >= MIN_LANE - 1e-6,
                `seed ${ seed } seg ${ s.index }: corridor ${ passableCorridorWidth( s ) } < MIN_LANE ${ MIN_LANE }`,
            );
        }
    }
} );

test( 'the bounded retry leaves gap segments identical across two materializations', () => {
    for ( const seed of SEEDS ) {
        const a = gapSegments( resolveTrack( procgenDescriptor( seed ) ) );
        const b = gapSegments( resolveTrack( procgenDescriptor( seed ) ) );
        assert.equal( JSON.stringify( a ), JSON.stringify( b ), `seed ${ seed }: gap blocks are not deterministic` );
    }
} );
