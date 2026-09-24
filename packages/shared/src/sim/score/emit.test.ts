import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    analyzeTrack,
    CALM_TUBE_HALF,
    type ComposedScore,
    composeScore,
    emitScore,
    FRACTURE_SHADOW_SEGMENTS,
    freeReach,
    HALF_WIDTH,
    isHole,
    MIN_LANE,
    type Motif,
    motifFailures,
    parseMotif,
    passableCorridorWidth,
    SCORE_ACCENT_ADHERENCE,
    SCORE_ADHERENCE_FLOOR,
    type ScoreNote,
    SEG_LEN,
    type Segment,
    START_SAFE,
    scoreAdherence,
    scoreSpans,
    scoreTrack,
    sealShadowed,
    segmentsTrack,
    TRACK_SEGMENTS,
    type Track,
} from '../../index.js';

const SEEDS = [ 1, 2, 3, 4, 5, 6 ];

const accented: Motif[] = [
    { id: 'a1', notes: '!l J !r', intensity: [ 0, 1 ], weight: 1, mirror: true, stretch: [ 1, 2 ] },
    { id: 'a2', notes: 'R !L J', intensity: [ 0, 1 ], weight: 1, mirror: true, stretch: [ 1, 1 ] },
    { id: 'a3', notes: 'J !< !R', intensity: [ 0, 1 ], weight: 1, mirror: true, stretch: [ 1, 1 ] },
];
const smashing: Motif[] = [
    { id: 's1', notes: 'S l S', intensity: [ 0, 1 ], weight: 1, mirror: true, stretch: [ 1, 2 ] },
    { id: 's2', notes: 'r J S', intensity: [ 0, 1 ], weight: 1, mirror: true, stretch: [ 1, 1 ] },
];

function trackOf( score: ComposedScore ): Track {
    return segmentsTrack( emitScore( score ).segments, score.length );
}

function expected( score: ComposedScore, accentsOnly = false ): ScoreNote[] {
    return score.notes
        .filter( ( n ) => n.kind !== 'rest' && ( ! accentsOnly || n.accent ) )
        .map( ( n ) => ( {
            kind: n.kind === 'rest' ? 'step' : n.kind,
            k0: n.z,
            k1: n.z,
            dir: n.dir,
            cells: n.cells,
            token: n.token,
            spacing: 0,
            early: 0,
            rests: 0,
        } ) );
}

function segmentsOf( t: Track ): Segment[] {
    return Array.from( { length: TRACK_SEGMENTS }, ( _, i ) => t.segmentAt( i ) );
}

test( 'the custom test libraries pass the load-time motif check', () => {
    assert.deepEqual( motifFailures( [ ...accented, ...smashing ] ), [] );
} );

test( 'the easiest route plays the score: adherence meets the floor and the transcript round-trips', () => {
    for ( const seed of SEEDS ) {
        const score = composeScore( seed );
        const report = analyzeTrack( trackOf( score ) );
        const want = expected( score );
        const adherence = scoreAdherence( want, report.score.notes );
        assert.ok( adherence.share >= SCORE_ADHERENCE_FLOOR, `seed ${ seed } adherence ${ adherence.share }` );
        assert.deepEqual(
            report.score.notes.map( ( n ) => n.token ),
            want.map( ( n ) => n.token ),
            `seed ${ seed } round-trip`,
        );
        assert.equal(
            report.path.stuck.reduce( ( a, b ) => a + b, 0 ),
            0,
        );
    }
} );

test( 'every accent is played by the easiest route', () => {
    const motifs = accented.map( parseMotif );
    for ( const seed of SEEDS.slice( 0, 3 ) ) {
        const score = composeScore( seed, TRACK_SEGMENTS, motifs );
        const accents = expected( score, true );
        assert.ok( accents.length > 10 );
        const report = analyzeTrack( trackOf( score ) );
        assert.equal( scoreAdherence( accents, report.score.notes ).share, SCORE_ACCENT_ADHERENCE );
        for ( const s of emitScore( score ).spans )
            if ( s.role === 'gate' ) assert.ok( s.b - s.a >= MIN_LANE - 1e-9, `gate ${ s.a }..${ s.b }` );
    }
} );

test( 'every z-slice keeps a ≥ MIN_LANE open corridor', () => {
    for ( let seed = 1; seed <= 30; seed++ ) {
        const t = scoreTrack( seed );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const s = t.segmentAt( i );
            if ( isHole( s ) ) continue;
            assert.ok( passableCorridorWidth( s ) >= MIN_LANE - 1e-6, `seed ${ seed } seg ${ i }` );
        }
    }
} );

test( 'the score curve sets the wall reach: a calm curve opens the corridor wider than a hot one', () => {
    const length = 40;
    const calm = Array.from( { length }, () => 0 );
    const hot = Array.from( { length }, () => 1 );
    const z = 20 * SEG_LEN;
    assert.ok( freeReach( z, length, calm ) > freeReach( z, length, hot ) );
    assert.equal( freeReach( z, length ), freeReach( z, length, undefined ) );
    const reachOf = ( curve: number[] ) =>
        scoreSpans( composeScore( 1, length, undefined, curve ) ).find( ( s ) => s.role === 'calm' && s.z0 >= z );
    const a = reachOf( calm );
    const b = reachOf( hot );
    assert.ok( a !== undefined && b !== undefined );
    assert.ok( a.b - a.a >= b.b - b.a );
} );

test( 'the calm tube stays clear: no block reaches within CALM_TUBE_HALF of the line during a calm', () => {
    for ( const seed of SEEDS ) {
        const { spans, segments } = emitScore( composeScore( seed ) );
        const blocks = segments.flatMap( ( s ) => s.blocks );
        for ( const s of spans ) {
            if ( s.role !== 'calm' ) continue;
            const lo = Math.max( -HALF_WIDTH, s.line - CALM_TUBE_HALF );
            const hi = Math.min( HALF_WIDTH, s.line + CALM_TUBE_HALF );
            for ( const b of blocks )
                if ( b.z0 < s.z1 && b.z1 > s.z0 ) assert.ok( b.x1 <= lo || b.x0 >= hi, `seed ${ seed } z ${ b.z0 }` );
        }
    }
} );

test( 'a smash note is a fractured block that sealShadowed leaves alone', () => {
    const motifs = smashing.map( parseMotif );
    for ( const seed of SEEDS.slice( 0, 3 ) ) {
        const t = trackOf( composeScore( seed, TRACK_SEGMENTS, motifs ) );
        let fractured = 0;
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const seg = t.segmentAt( i );
            fractured += seg.blocks.filter( ( b ) => b.kind === 'fractured' ).length;
            const ahead = Array.from( { length: FRACTURE_SHADOW_SEGMENTS + 1 }, ( _, k ) => t.segmentAt( i + k + 1 ) );
            assert.deepEqual( sealShadowed( seg, ahead ), seg.blocks, `seed ${ seed } seg ${ i }` );
            if ( isHole( seg ) ) continue;
            const open = { ...seg, blocks: seg.blocks.filter( ( b ) => b.kind === 'sealed' ) };
            assert.ok( passableCorridorWidth( open ) >= MIN_LANE - 1e-6, `seed ${ seed } seg ${ i }` );
        }
        assert.ok( fractured > 10 );
    }
} );

test( 'the standard library emits no fractured block', () => {
    for ( const seed of SEEDS )
        for ( const s of segmentsOf( scoreTrack( seed ) ) ) assert.ok( s.blocks.every( ( b ) => b.kind === 'sealed' ) );
} );

test( 'a jump opens one hole segment at its onset, a double jump two, none in start-safe', () => {
    for ( const seed of SEEDS ) {
        const score = composeScore( seed );
        const segs = emitScore( score ).segments;
        const holes = segs.filter( isHole ).map( ( s ) => s.index );
        const want = score.notes.flatMap( ( n ) => {
            const i = n.z / 20;
            if ( n.kind === 'jump' ) return [ i ];
            return n.kind === 'double' ? [ i, i + 1 ] : [];
        } );
        assert.deepEqual( holes, want );
        assert.ok( holes.every( ( i ) => i >= START_SAFE ) );
    }
} );

test( 'blocks stay inside their segment and the renderer window budget', () => {
    const WINDOW = Math.ceil( ( 900 + 240 ) / 20 ) + 1;
    for ( const seed of SEEDS ) {
        const segs = segmentsOf( scoreTrack( seed ) );
        for ( const s of segs ) for ( const b of s.blocks ) assert.ok( b.z0 >= s.z0 && b.z1 <= s.z1 );
        const counts = segs.map( ( s ) => s.blocks.length );
        for ( let i = 0; i + WINDOW <= counts.length; i++ ) {
            const n = counts.slice( i, i + WINDOW ).reduce( ( a, b ) => a + b, 0 );
            assert.ok( n < 320, `seed ${ seed } window ${ i }: ${ n }` );
        }
    }
} );

test( 'a seed emits the same geometry every time', () => {
    assert.deepEqual( segmentsOf( scoreTrack( 9 ) ), segmentsOf( scoreTrack( 9 ) ) );
} );
