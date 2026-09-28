import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    BLOCK_WIDTH_MIN,
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
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) ) ) {
            total++;
            if ( s.blocks.length > 0 ) carrying++;
        }
    }
    assert.ok( total > 0, 'no gap segments generated' );
    assert.ok( carrying > 0, 'no gap segment carries a block — the two verbs still never overlap' );
} );

test( 'a full-width gap never carries a block, because there is nothing to stand on', () => {
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) ) ) {
            if ( ! isHole( s ) ) continue;
            assert.equal( s.blocks.length, 0, `seed ${ seed } seg ${ s.index }: a block floating over a full gap` );
        }
    }
} );

test( 'a gap block sits on a full-span deck and on the landing side of the segment', () => {
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) ) ) {
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

test( 'gap block widths are continuous, not the 4/8/12 lane picket', () => {
    const widths: number[] = [];
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) ) ) {
            for ( const b of s.blocks ) widths.push( b.x1 - b.x0 );
        }
    }
    assert.ok( widths.length > 50, `only ${ widths.length } gap blocks` );
    const counts = new Map< string, number >();
    for ( const w of widths ) counts.set( w.toFixed( 2 ), ( counts.get( w.toFixed( 2 ) ) ?? 0 ) + 1 );
    const top = Math.max( ...counts.values() );
    assert.ok( top / widths.length <= 0.1, `one width holds ${ top } of ${ widths.length } gap blocks` );
    assert.ok(
        widths.some( ( w ) => w > 12 ),
        'no gap block is wider than the old 12u cap',
    );
    assert.ok(
        widths.every( ( w ) => w >= BLOCK_WIDTH_MIN - 1e-6 ),
        'a gap block is narrower than BLOCK_WIDTH_MIN',
    );
} );

test( 'the combined gap-plus-block result still clears MIN_LANE at every slice', () => {
    for ( const seed of SEEDS ) {
        for ( const s of gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) ) ) {
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
        const a = gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) );
        const b = gapSegments( resolveTrack( procgenDescriptor( seed, 'weave' ) ) );
        assert.equal( JSON.stringify( a ), JSON.stringify( b ), `seed ${ seed }: gap blocks are not deterministic` );
    }
} );
