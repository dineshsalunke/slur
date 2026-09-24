import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    type ComposedScore,
    choosePhrase,
    composeScore,
    formatNotes,
    MOTIF_FLIGHT_SPEEDS,
    MOTIFS,
    motifFlightFailures,
    motifsAt,
    parseMotif,
    phraseFits,
    REGISTER_GAP_Z,
    REST_INTENSITY,
    SCORE_LINE_LIMIT,
    SEG_LEN,
    START_SAFE,
    TRACK_SEGMENTS,
    varyMotif,
} from '../../index.js';

const SEEDS = Array.from( { length: 30 }, ( _, i ) => i + 1 );
const scores = new Map< number, ComposedScore >( SEEDS.map( ( seed ) => [ seed, composeScore( seed ) ] ) );
const scoreOf = ( seed: number ): ComposedScore => scores.get( seed ) as ComposedScore;
const played = ( sc: ComposedScore ) => sc.notes.filter( ( n ) => n.kind !== 'rest' );

test( 'a seed composes the same score every time, and seeds differ', () => {
    assert.deepEqual( composeScore( 7 ), composeScore( 7 ) );
    assert.notEqual( formatNotes( scoreOf( 1 ).notes ), formatNotes( scoreOf( 2 ).notes ) );
} );

test( 'onsets sit back to back on the segment grid from START_SAFE to the finish', () => {
    for ( const seed of SEEDS ) {
        const sc = scoreOf( seed );
        let z = START_SAFE * SEG_LEN;
        for ( const n of sc.notes ) {
            assert.equal( n.z, z, `seed ${ seed }` );
            assert.equal( n.z % SEG_LEN, 0 );
            z += n.duration;
        }
        const end = TRACK_SEGMENTS * SEG_LEN;
        assert.ok( z <= end && end - z < 60, `seed ${ seed } ends at ${ z }` );
    }
} );

test( 'the score line stays inside the deck', () => {
    for ( const seed of SEEDS )
        for ( const n of scoreOf( seed ).notes ) assert.ok( Math.abs( n.x ) <= SCORE_LINE_LIMIT, `seed ${ seed }` );
} );

test( 'a phrase plays a motif only where the envelope puts it in that motif’s band', () => {
    for ( const seed of SEEDS )
        for ( const p of scoreOf( seed ).phrases ) {
            if ( p.motif === null ) continue;
            const m = MOTIFS.find( ( x ) => x.id === p.motif );
            assert.ok( m !== undefined );
            assert.ok( p.intensity >= REST_INTENSITY );
            assert.ok( m.intensity[ 0 ] <= p.intensity && p.intensity <= m.intensity[ 1 ], `${ seed } ${ p.motif }` );
        }
} );

test( 'the register gap holds across phrase boundaries: the whole score flies clean at 55 and 124 u/s', () => {
    let boundaries = 0;
    for ( const seed of SEEDS ) {
        const sc = scoreOf( seed );
        const notes = played( sc );
        for ( let i = 1; i < notes.length; i++ ) {
            if ( notes[ i ].phrase === notes[ i - 1 ].phrase ) continue;
            boundaries++;
            const prev = notes[ i - 1 ];
            assert.ok( notes[ i ].z - prev.z >= prev.move * MOTIF_FLIGHT_SPEEDS[ 1 ] + REGISTER_GAP_Z );
        }
        for ( const speed of MOTIF_FLIGHT_SPEEDS )
            assert.deepEqual( motifFlightFailures( sc.notes, speed ), [], `seed ${ seed } at ${ speed }u/s` );
    }
    assert.ok( boundaries >= 150, `${ boundaries } phrase boundaries` );
} );

test( 'mirrored, repeated and stretched variants fly clean when chained', () => {
    for ( const m of MOTIFS )
        for ( const mirror of [ false, true ] ) {
            const notes = [
                ...varyMotif( m, { mirror, repeat: 2, stretch: 1 } ),
                ...varyMotif( m, { mirror: ! mirror, repeat: 1, stretch: 2 } ),
            ];
            for ( const speed of MOTIF_FLIGHT_SPEEDS )
                assert.deepEqual( motifFlightFailures( notes, speed ), [], `${ m.id } ${ mirror }` );
        }
} );

test( 'a variation mirrors, repeats and stretches the motif and nothing else', () => {
    const m = parseMotif( {
        id: 't',
        notes: 'L J !r',
        intensity: [ 0, 1 ],
        weight: 1,
        mirror: true,
        stretch: [ 1, 3 ],
    } );
    assert.equal( formatNotes( varyMotif( m, { mirror: false, repeat: 1, stretch: 1 } ) ), 'L J !r' );
    assert.equal( formatNotes( varyMotif( m, { mirror: true, repeat: 1, stretch: 1 } ) ), 'R J !l' );
    assert.equal( formatNotes( varyMotif( m, { mirror: false, repeat: 2, stretch: 1 } ) ), 'L J !r L J !r' );
    assert.equal( formatNotes( varyMotif( m, { mirror: false, repeat: 1, stretch: 3 } ) ), 'L . . J . . !r' );
    assert.equal( varyMotif( m, { mirror: true, repeat: 1, stretch: 1 } )[ 1 ].dir, 0 );
} );

test( 'the mirror is forced at the band edge', () => {
    const edge = SCORE_LINE_LIMIT - 2;
    for ( let index = 0; index < 50; index++ ) {
        const chosen = choosePhrase( 3, index, 0.5, edge, Number.POSITIVE_INFINITY );
        assert.ok( chosen !== null );
        assert.ok( phraseFits( chosen.notes, edge ) );
    }
    assert.equal( choosePhrase( 3, 0, 0.5, edge, 100 ), null );
} );

test( 'below the rest intensity the composer writes rests only', () => {
    assert.deepEqual( motifsAt( REST_INTENSITY / 2 ), [] );
    assert.equal( choosePhrase( 1, 0, REST_INTENSITY / 2, 0, 1e6 ), null );
} );

test( 'a track holds 28–56 played notes, and composing all 30 seeds is cheap', () => {
    const counts = SEEDS.map( ( seed ) => played( scoreOf( seed ) ).length );
    for ( const c of counts ) assert.ok( 28 <= c && c <= 56, `${ c } notes` );
    const t0 = performance.now();
    for ( const seed of SEEDS ) composeScore( seed + 100 );
    assert.ok( performance.now() - t0 < 500 );
} );
