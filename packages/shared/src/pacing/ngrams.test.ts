import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalGram, countGrams, PHRASE_BREAK_RESTS, type ScoreNote, scorePhrases, topGrams } from '../index.js';

function n( token: string, rests = 0 ): ScoreNote {
    return { kind: 'step', k0: 0, k1: 0, dir: 0, cells: 1, token, spacing: 0, early: 0, rests };
}

test( 'a gram and its mirror count as one', () => {
    assert.equal( canonicalGram( [ 'r', 'r', 'l' ] ), canonicalGram( [ 'l', 'l', 'r' ] ) );
    assert.equal( canonicalGram( [ 'J', '>', 'S' ] ), canonicalGram( [ 'J', '<', 'S' ] ) );
} );

test( 'rests sit inside a phrase and a long rest ends it', () => {
    const phrases = scorePhrases( [ n( 'r', 1 ), n( 'l' ), n( 'J', PHRASE_BREAK_RESTS ), n( 'R' ) ] );
    assert.deepEqual( phrases, [ [ [ 'r', '.' ], [ 'l' ], [ 'J' ] ], [ [ 'R' ] ] ] );
} );

test( 'grams count 3 to 8 notes within phrases, with no trailing rest', () => {
    const score = [ n( 'r' ), n( 'l' ), n( 'r', 1 ), n( 'r' ), n( 'l' ), n( 'r' ) ];
    const counts = countGrams( [ score ] );
    assert.equal( counts.get( canonicalGram( [ 'r', 'l', 'r' ] ) ), 2 );
    assert.equal( counts.get( canonicalGram( [ 'l', 'r', '.', 'r' ] ) ), 1 );
    assert.equal(
        [ ...counts.keys() ].some( ( k ) => k.endsWith( '.' ) ),
        false,
    );
    const bare = countGrams( [ score ], { rests: false } );
    assert.equal( bare.get( canonicalGram( [ 'r', 'r', 'l' ] ) ), 1 );
    assert.equal( bare.get( canonicalGram( [ 'l', 'r', 'r' ] ) ), 1 );
    const top = topGrams( counts, 1 );
    assert.equal( top[ 0 ].count, 2 );
    assert.equal( top[ 0 ].notes, 3 );
} );
