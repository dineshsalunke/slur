import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    applyDescriptor,
    type ComposedScore,
    composeScore,
    isHole,
    procgenDescriptor,
    resolveTrack,
    type Segment,
    START_SAFE,
    scoreTrack,
    segIndexForZ,
    TRACK_GENS,
    TRACK_SEGMENTS,
    type Track,
    TrackDescriptorState,
    toDescriptor,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 0x0fffffff, 42, 99991, 0xffffffff ];
const N = TRACK_SEGMENTS + 4;

function segEqual( a: Segment, b: Segment ): boolean {
    return JSON.stringify( a ) === JSON.stringify( b );
}

function scoreGapRuns( t: Track, score: ComposedScore, label: string ): number {
    const jj = new Set( score.notes.filter( ( n ) => n.token === 'JJ' ).map( ( n ) => segIndexForZ( n.z ) ) );
    for ( let i = 0; i < START_SAFE; i++ )
        assert.ok( ! isHole( t.segmentAt( i ) ), `${ label } gap in start-safe seg ${ i }` );
    let doubles = 0;
    let i = START_SAFE;
    while ( i < TRACK_SEGMENTS ) {
        let run = 0;
        while ( isHole( t.segmentAt( i + run ) ) ) run++;
        if ( run > 1 ) {
            assert.equal( run, 2, `${ label } ${ run } gaps in a row at ${ i }` );
            assert.ok( jj.has( i ), `${ label } two gaps in a row at ${ i } are not a JJ` );
            doubles++;
        }
        i += Math.max( run, 1 );
    }
    return doubles;
}

test( 'the generator round-trips through the wire schema and an omitted one reads as weave', () => {
    for ( const gen of TRACK_GENS ) {
        const state = new TrackDescriptorState();
        applyDescriptor( state, procgenDescriptor( 7, gen ) );
        const back = toDescriptor( state );
        assert.equal( back.kind === 'procgen' && back.gen, gen );
    }
    const state = new TrackDescriptorState();
    applyDescriptor( state, { kind: 'procgen', seed: 7, tier: 0, length: TRACK_SEGMENTS } );
    const back = toDescriptor( state );
    assert.equal( back.kind === 'procgen' && back.gen, 'weave' );
} );

test( 'a score descriptor resolves to the emitted score geometry', () => {
    for ( const seed of SEEDS.slice( 0, 3 ) ) {
        const a = resolveTrack( procgenDescriptor( seed, 'score' ) );
        const b = scoreTrack( seed, TRACK_SEGMENTS );
        assert.equal( a.finishZ, b.finishZ );
        for ( let i = 0; i < N; i++ ) {
            assert.ok( segEqual( a.segmentAt( i ), b.segmentAt( i ) ), `seed ${ seed } seg ${ i } diverged` );
        }
    }
} );

test( 'score: the only two gaps in a row are a JJ, never three, none in start-safe', () => {
    let doubles = 0;
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed, 'score' ) );
        doubles += scoreGapRuns( t, composeScore( seed, TRACK_SEGMENTS ), `seed ${ seed }` );
    }
    assert.ok( doubles > 0, 'the standard library emitted no JJ, so the exemption went untested' );
} );
