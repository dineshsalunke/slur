import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CELL, type FlightTuning, SCORE_ADHERENCE_FLOOR } from '../../constants.js';
import { analyzeTrack } from '../../pacing/analyze.js';
import { freezeTrack } from '../../pacing/grid.js';
import { type PacingPocket, rosterPockets } from '../../pacing/pockets.js';
import { type ScoreNote, scoreAdherence } from '../../pacing/score.js';
import { SHIP_CLASSES } from '../../ship-classes.js';
import { avoidPilot, cached, fly, type Steer } from '../avoid-pilot.test.js';
import type { GrooveObstacle } from '../groove/islands.js';
import { HALF_WIDTH, SEG_LEN, type Track } from '../space.js';
import { procgenDescriptor, resolveTrack } from '../track-provider.js';
import { phraseOpenFailures, phraseOpenSpace } from './open-space.js';
import { buildPhrase, phraseTrack } from './phrase-track.js';
import { PHRASE_SECTION, PHRASE_SECTIONS, phraseSegments, phraseStartZ, planPhrases } from './plan.js';
import { phraseWeaves, weaveTarget } from './weave.test.js';

const SEEDS = Array.from( { length: 30 }, ( _, k ) => k + 1 );
const FLIGHT_SEEDS = [ 1, 2, 3, 4, 5, 17 ];

function placedScore( seed: number ): ScoreNote[] {
    return buildPhrase( seed ).notes.map( ( n ) => ( {
        kind: n.kind === 'rest' ? 'step' : n.kind,
        k0: n.z,
        k1: n.z,
        dir: Math.sign( n.to - n.from ),
        cells: Math.abs( n.to - n.from ) / CELL,
        token: n.token,
        spacing: 0,
        early: 0,
        rests: 0,
    } ) );
}

function motifLinePilot( seed: number, track: Track, t: FlightTuning ): Steer {
    const { plan, notes } = buildPhrase( seed );
    const motifs = plan.phrases.filter( ( p ) => p.notes !== null );
    const marks = [
        ...motifs.map( ( p ) => ( { z: p.z0, to: p.x0 } ) ),
        ...notes.map( ( n ) => ( { z: n.z, to: n.to } ) ),
    ].sort( ( a, b ) => a.z - b.z );
    const weaves = phraseWeaves( seed );
    const avoid = avoidPilot( track, t );
    let next = 0;
    let target = 0;
    return ( tick, s ) => {
        const off = avoid( tick, s );
        while ( next < marks.length && s.z - t.halfL >= marks[ next ].z ) target = marks[ next++ ].to;
        const band = weaveTarget( weaves, s.x, s.z, s.vz, t.halfL );
        if ( band !== null ) return { target: band, jump: false, brake: false };
        const on = motifs.some( ( p ) => s.z + t.halfL >= p.z0 && s.z - t.halfL < p.z1 );
        return on ? { target, jump: false, brake: false } : off;
    };
}

test( 'a phrase seed emits the same geometry every time', () => {
    assert.deepEqual( buildPhrase( 7 ), buildPhrase( 7 ) );
    assert.notDeepEqual( buildPhrase( 7 ).segments, buildPhrase( 8 ).segments );
} );

test( 'the phrase descriptor carries its own length and resolves to the phrase track', () => {
    const d = procgenDescriptor( 3, 'phrase' );
    assert.equal( d.kind === 'procgen' && d.length, phraseSegments( 3 ) );
    const track = resolveTrack( d );
    assert.equal( track.finishZ, phraseSegments( 3 ) * SEG_LEN );
    assert.deepEqual( track.segmentAt( 300 ), phraseTrack( 3 ).segmentAt( 300 ) );
    assert.ok( track.anchors.length > 0 );
} );

test( 'the section count follows the length, and the phrases tile the track on the cell grid', () => {
    const counts: number[] = [];
    for ( const length of [ 100, 200, 400, 600, 800, 1200 ] ) {
        const plan = planPhrases( 1, length );
        counts.push( plan.sections );
        assert.equal( plan.vocabulary.length, plan.sections );
        let z = phraseStartZ();
        for ( const p of plan.phrases ) {
            assert.equal( p.z0, z, `length ${ length }: gap before ${ p.role } at ${ z }` );
            assert.ok( p.z1 > p.z0 );
            assert.equal( p.z0 % CELL, 0 );
            z = p.z1;
        }
        assert.equal( z, length * SEG_LEN );
        assert.equal( plan.phrases[ plan.phrases.length - 1 ].role, 'finish' );
        if ( length < 400 ) continue;
        for ( let s = 0; s < plan.sections; s++ ) {
            const roles = plan.phrases.filter( ( p ) => p.section === s && p.role !== 'finish' ).map( ( p ) => p.role );
            assert.deepEqual( roles, PHRASE_SECTION, `length ${ length } section ${ s }` );
        }
    }
    assert.deepEqual(
        counts,
        [ ...counts ].sort( ( a, b ) => a - b ),
    );
    assert.ok( counts[ counts.length - 1 ] > counts[ 2 ] );
} );

test( 'the derived phrase length fits 5 sections rising low, low, mid, mid, high', () => {
    for ( const seed of SEEDS ) {
        const plan = planPhrases( seed, phraseSegments( seed ) );
        assert.equal( plan.sections, PHRASE_SECTIONS, `seed ${ seed }` );
        const acts = Array.from(
            { length: plan.sections },
            ( _, s ) => plan.phrases.find( ( p ) => p.section === s )?.act,
        );
        assert.deepEqual( acts, [ 'low', 'low', 'mid', 'mid', 'high' ], `seed ${ seed }` );
    }
} );

test( 'a run teaches one motif per section, repeats it exactly, and twists it once', () => {
    for ( const seed of SEEDS ) {
        const { plan, notes } = buildPhrase( seed );
        const ids = plan.vocabulary.map( ( m ) => m.motif.id );
        assert.equal( new Set( ids ).size, ids.length, `seed ${ seed }: repeated motif` );
        for ( let s = 0; s < plan.sections; s++ ) {
            const at = ( role: string ) => plan.phrases.findIndex( ( p ) => p.section === s && p.role === role );
            const shape = ( k: number ) =>
                notes
                    .filter( ( n ) => n.phrase === k )
                    .map( ( n ) => [ n.token, n.from, n.to, n.z - plan.phrases[ k ].z0 ] );
            assert.deepEqual( shape( at( 'repeat' ) ), shape( at( 'teach' ) ), `seed ${ seed } section ${ s }` );
            assert.notDeepEqual( shape( at( 'twist' ) ), shape( at( 'teach' ) ), `seed ${ seed } section ${ s }` );
        }
        assert.equal( plan.vocabulary[ plan.sections - 1 ].twistKind, 'callback' );
    }
} );

test( 'obstacles sit only inside motif and weave phrases, and every one of those has content', () => {
    for ( const seed of SEEDS.slice( 0, 10 ) ) {
        const { plan, notes, obstacles } = buildPhrase( seed );
        const open = plan.phrases.filter( ( p ) => p.kind === 'arena' || p.kind === 'rest' );
        for ( const o of obstacles )
            assert.ok( ! open.some( ( p ) => o.z0 < p.z1 && p.z0 < o.z1 ), `seed ${ seed }: obstacle at ${ o.z0 }` );
        plan.phrases.forEach( ( p, k ) => {
            const at = `seed ${ seed }: ${ p.role } at ${ p.z0 }`;
            if ( p.kind === 'weave' )
                assert.ok(
                    obstacles.some( ( o ) => o.z0 >= p.z0 && o.z1 <= p.z1 ),
                    at,
                );
            if ( p.kind !== 'motif' || p.notes === null ) return;
            const played = notes.filter( ( n ) => n.phrase === k ).length;
            assert.equal( played, p.notes.filter( ( n ) => n.kind !== 'rest' ).length, at );
        } );
    }
} );

test( 'seeds 1–30 meet every open-space target, and every arena is fully open', () => {
    for ( const seed of SEEDS ) {
        const { plan } = buildPhrase( seed );
        const r = phraseOpenSpace( cached( phraseTrack( seed ) ), plan );
        assert.deepEqual( phraseOpenFailures( r ), [], `seed ${ seed }` );
        assert.equal( r.wideShare.arena, 1 );
    }
} );

function overDividerHole( obstacles: readonly GrooveObstacle[] ): ( p: PacingPocket ) => boolean {
    const strips = obstacles.filter( ( o ) => o.kind === 'hole' && o.x1 - o.x0 < 2 * HALF_WIDTH );
    return ( p ) => strips.some( ( h ) => h.z0 <= p.k0 && p.k1 <= h.z1 && h.x0 <= p.x0 && p.x1 <= h.x1 );
}

test( 'no roster pocket on phrase seeds, except the fall zone over a weave hole divider', () => {
    for ( const seed of SEEDS.slice( 0, 10 ) ) {
        const fall = overDividerHole( buildPhrase( seed ).obstacles );
        const pockets = rosterPockets( freezeTrack( phraseTrack( seed ) ) ).filter( ( p ) => ! fall( p ) );
        assert.deepEqual( pockets, [], `seed ${ seed }` );
    }
} );

test( 'the easiest route plays the motif notes: adherence meets the ADR-020 floor on seeds 1–30', () => {
    for ( const seed of SEEDS ) {
        const played = analyzeTrack( cached( phraseTrack( seed ) ) ).score.notes;
        const a = scoreAdherence( placedScore( seed ), played );
        assert.ok( a.share >= SCORE_ADHERENCE_FLOOR, `seed ${ seed } adherence ${ a.share }` );
    }
} );

test( 'every class finishes with the avoid pilot and no death, and the motif line is no slower', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        for ( const seed of FLIGHT_SEEDS ) {
            const track = cached( phraseTrack( seed ) );
            const avoid = fly( track, c.tuning, avoidPilot( track, c.tuning ) );
            const line = fly( track, c.tuning, motifLinePilot( seed, track, c.tuning ) );
            const at = `${ c.id } seed ${ seed }: avoid ${ JSON.stringify( avoid ) } line ${ JSON.stringify( line ) }`;
            assert.ok( avoid.finished && avoid.deaths === 0, at );
            assert.ok( line.finished && line.deaths === 0 && line.ticks <= avoid.ticks, at );
        }
    }
} );

test( 'phrase pickup ids are unique and stable', () => {
    for ( const seed of SEEDS ) {
        const ids = phraseTrack( seed ).anchors.map( ( a ) => a.id );
        assert.equal( new Set( ids ).size, ids.length, `seed ${ seed }: duplicate pickup id` );
        assert.deepEqual(
            ids,
            phraseTrack( seed ).anchors.map( ( a ) => a.id ),
        );
    }
} );
