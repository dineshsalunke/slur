import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    analyzeDescriptor,
    analyzeTrack,
    NOTE_MOVE_S,
    PACING_DZ,
    procgenDescriptor,
    REGISTER_GAP_S,
    REST_UNIT_U,
    SCORE_REGISTER_CRUISE,
    type ScoreLine,
    type Segment,
    scoreAdherence,
    transcribe,
} from '../index.js';
import { syntheticTrack } from './fixture.test.js';

const COUNT = 1000;

function line( steps: Array< [ number, number ] >, airRuns: Array< [ number, number ] > = [] ): ScoreLine {
    const x = new Float32Array( COUNT );
    const air = new Uint8Array( COUNT );
    let at = 0;
    for ( let k = 0; k < COUNT; k++ ) {
        for ( const [ k0, dx ] of steps ) if ( k >= k0 && k < k0 + 4 ) at += dx / 4;
        x[ k ] = at;
    }
    for ( const [ k0, len ] of airRuns ) for ( let k = k0; k < k0 + len; k++ ) air[ k ] = 1;
    return { x, air };
}

const spacing = ( move: number ): number => SCORE_REGISTER_CRUISE * ( move + REGISTER_GAP_S );

function near( actual: number, expected: number ): void {
    assert.ok( Math.abs( actual - expected ) < 1e-9, `${ actual } is not ${ expected }` );
}

test( 'settled steps become notes by size and a sub-cell wiggle does not', () => {
    const s = transcribe(
        line( [
            [ 100, 4 ],
            [ 400, -8 ],
            [ 700, 2 ],
        ] ),
        [],
        20,
    );
    assert.deepEqual(
        s.notes.map( ( n ) => n.token ),
        [ 'r', 'L' ],
    );
    near( s.notes[ 0 ].spacing, spacing( NOTE_MOVE_S.step1 ) );
    near( s.notes[ 1 ].spacing, spacing( NOTE_MOVE_S.step2 ) );
    assert.equal( s.breaches, 0 );
    assert.ok( s.calms.some( ( c ) => c.drift === 2 ) );
} );

test( 'a step wider than two cells is a held strafe', () => {
    const s = transcribe( line( [ [ 100, 12 ] ] ), [], 20 );
    assert.deepEqual(
        s.notes.map( ( n ) => n.token ),
        [ '>' ],
    );
} );

test( 'a per-segment staircase reads as one held strafe with a segment merge gap', () => {
    const stairs = line( [ 100, 120, 140, 160 ].map( ( k ): [ number, number ] => [ k, 4 ] ) );
    assert.equal( transcribe( stairs, [], 20 ).notes.length, 4 );
    assert.deepEqual(
        transcribe( stairs, [], 20, 20 ).notes.map( ( n ) => n.token ),
        [ '>' ],
    );
} );

test( 'a note that starts inside the previous note spacing is a breach', () => {
    const s = transcribe(
        line( [
            [ 100, 4 ],
            [ 180, 4 ],
        ] ),
        [],
        20,
    );
    assert.equal( s.breaches, 1 );
    const early = s.notes[ 0 ].spacing - 80 * PACING_DZ;
    near( s.notes[ 1 ].early, early );
    assert.equal( s.notes[ 0 ].rests, 0 );
} );

test( 'rests count whole rest units of slack after the spacing', () => {
    const s = transcribe(
        line( [
            [ 100, 4 ],
            [ 500, 4 ],
        ] ),
        [],
        20,
    );
    assert.equal( s.notes[ 0 ].rests, Math.floor( ( 400 * PACING_DZ - s.notes[ 0 ].spacing ) / REST_UNIT_U ) );
} );

test( 'an air run within single reach is J and a longer one is JJ', () => {
    const s = transcribe(
        line(
            [],
            [
                [ 100, 15 ],
                [ 600, 40 ],
            ],
        ),
        [],
        20,
    );
    assert.deepEqual(
        s.notes.map( ( n ) => n.token ),
        [ 'J', 'JJ' ],
    );
    near( s.notes[ 1 ].spacing, spacing( NOTE_MOVE_S.double ) );
} );

test( 'a fractured block on the line is a smash; one beside it is not', () => {
    const seg = ( x0: number, x1: number ): Segment => ( {
        index: 10,
        z0: 200,
        z1: 220,
        kind: 'block',
        floors: [],
        isFinish: false,
        blocks: [ { id: 640, kind: 'fractured', x0, x1, y0: 0, y1: 8, z0: 204, z1: 208 } ],
    } );
    assert.deepEqual(
        transcribe( line( [] ), [ seg( -2, 2 ) ], 20 ).notes.map( ( n ) => n.token ),
        [ 'S' ],
    );
    assert.equal( transcribe( line( [] ), [ seg( 8, 12 ) ], 20 ).notes.length, 0 );
} );

test( 'adherence counts score notes the route plays in the same voice, direction and window', () => {
    const score = transcribe(
        line(
            [
                [ 100, 4 ],
                [ 400, -4 ],
            ],
            [ [ 700, 10 ] ],
        ),
        [],
        20,
    ).notes;
    assert.equal( scoreAdherence( score, score ).share, 1 );
    const late = transcribe(
        line( [
            [ 150, 4 ],
            [ 600, -4 ],
        ] ),
        [],
        20,
    ).notes;
    const a = scoreAdherence( score, late );
    assert.equal( a.played, 1 );
    assert.equal( a.notes, 3 );
    const mirrored = transcribe(
        line( [
            [ 100, -4 ],
            [ 400, 4 ],
        ] ),
        [],
        20,
    ).notes;
    assert.equal( scoreAdherence( score, mirrored ).played, 0 );
} );

test( 'a gap on the reference path transcribes as a jump note', () => {
    const track = syntheticTrack( 12, ( s ) => ( s.index === 6 ? { ...s, kind: 'gap', floors: [] } : s ) );
    const r = analyzeTrack( track );
    assert.deepEqual(
        r.score.notes.map( ( n ) => n.token ),
        [ 'J' ],
    );
} );

test( 'a procgen report carries a line score and its adherence', () => {
    const r = analyzeDescriptor( procgenDescriptor( 20260921, 'weave' ) );
    assert.ok( r.line !== null && r.line.notes.length > 0 );
    assert.ok( r.adherence !== null && r.adherence.share >= 0 && r.adherence.share <= 1 );
    assert.ok( r.score.notes.length > 0 );
} );
