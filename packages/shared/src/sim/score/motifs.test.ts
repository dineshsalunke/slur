import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    CONTRACT_TUNING,
    MOTIF_LIBRARY,
    MOTIFS,
    type Motif,
    motifFailures,
    motifFlightFailures,
    parseNotes,
} from '../../index.js';

const ok: Motif = { id: 'ok', notes: 'L J r', intensity: [ 0, 1 ], weight: 1, mirror: true, stretch: [ 1, 2 ] };

test( 'the seeded library holds the owner’s top S0 motifs and passes the load-time check', () => {
    assert.deepEqual(
        MOTIF_LIBRARY.map( ( m ) => m.notes ),
        [
            'J l J',
            'l J r',
            'J l r',
            'l J J',
            'l r J',
            'l JJ r',
            'J l J J',
            'J l r J',
            'l J r J',
            'l J l r',
            'J l J r',
            'J l JJ r',
            'L J r J J',
            'J l r J l',
            'l J l r J',
            'J < R r l',
            'J L r J J',
            'L JJ r J l',
        ],
    );
    assert.deepEqual( motifFailures( MOTIF_LIBRARY ), [] );
    assert.equal( MOTIFS.length, MOTIF_LIBRARY.length );
    assert.equal( MOTIFS[ 0 ].length, 140 + 120 + 140 );
} );

test( 'a malformed motif is named with every reason it fails', () => {
    const bad = motifFailures( [
        ok,
        { ...ok, notes: 'l r' },
        { ...ok, id: 'x', notes: 'l q r' },
        { ...ok, id: 'y', intensity: [ 0.8, 0.2 ], weight: 0, stretch: [ 0, 1 ] },
        { ...ok, id: 'z', notes: '. . .' },
    ] );
    assert.ok( bad.some( ( f ) => f.startsWith( "ok 'l r'" ) && f.includes( 'repeated' ) ) );
    assert.ok( bad.some( ( f ) => f.includes( '2 notes is outside 3–8' ) ) );
    assert.ok( bad.some( ( f ) => f.startsWith( 'x' ) && f.includes( "note 2 'q'" ) ) );
    assert.ok( bad.some( ( f ) => f.startsWith( 'y' ) && f.includes( 'intensity' ) ) );
    assert.ok( bad.some( ( f ) => f.startsWith( 'y' ) && f.includes( 'weight' ) ) );
    assert.ok( bad.some( ( f ) => f.startsWith( 'y' ) && f.includes( 'stretch' ) ) );
    assert.ok( bad.some( ( f ) => f.startsWith( 'z' ) && f.includes( 'every note is a rest' ) ) );
} );

test( 'the contract ship flies each note and keeps the register gap at both speeds', () => {
    const notes = parseNotes( 'R L < > J JJ S . r' );
    assert.deepEqual( motifFlightFailures( notes, 55 ), [] );
    assert.deepEqual( motifFlightFailures( notes, 124 ), [] );
} );

test( 'a ship that cannot settle inside the spacing fails the flight', () => {
    const sluggish = { ...CONTRACT_TUNING, strafeAccel: 40, strafeDamp: 2 };
    const fails = motifFlightFailures( parseNotes( 'L R L' ), 124, sluggish );
    assert.ok( fails.some( ( f ) => f.includes( 'register gap' ) || f.includes( 'not settled' ) ) );
} );
