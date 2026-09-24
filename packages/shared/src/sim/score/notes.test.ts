import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatNotes, NOTE_MOVE_S, noteDuration, parseNotes, REGISTER_GAP_S, SEG_LEN } from '../../index.js';

test( 'each note lasts its G3 duration: move plus the register gap, rounded up to a segment', () => {
    const lasts = ( src: string ): number[] => parseNotes( src ).map( ( n ) => n.duration );
    assert.deepEqual( lasts( 'l r L R J JJ S .' ), [ 120, 120, 140, 140, 140, 220, 80, 60 ] );
    assert.deepEqual( lasts( '< >' ), [ 160, 160 ] );
    for ( const n of parseNotes( 'l L < J JJ' ) ) {
        assert.equal( n.duration % SEG_LEN, 0 );
        assert.ok( n.duration / 124 >= n.move + REGISTER_GAP_S, n.token );
    }
    assert.equal( noteDuration( { kind: 'jump', dir: 0, cells: 0 } ), 140 );
} );

test( 'a note reads its direction, size and accent from the token', () => {
    const [ l, bigR, held, jj ] = parseNotes( ' l  !R\t< JJ ' );
    assert.deepEqual( [ l.kind, l.dir, l.cells, l.accent ], [ 'step', -1, 1, false ] );
    assert.deepEqual( [ bigR.kind, bigR.dir, bigR.cells, bigR.accent ], [ 'step', 1, 2, true ] );
    assert.deepEqual( [ held.kind, held.dir, held.cells ], [ 'held', -1, 3 ] );
    assert.equal( jj.kind, 'double' );
    assert.equal( jj.move, NOTE_MOVE_S.double );
} );

test( 'the parser round-trips and names the bad note', () => {
    const src = 'L !J > . S JJ';
    assert.equal( formatNotes( parseNotes( src ) ), src );
    assert.throws( () => parseNotes( '' ), /empty/ );
    assert.throws( () => parseNotes( 'l x r' ), /note 2 'x'/ );
    assert.throws( () => parseNotes( 'J|R' ), /note 1 'J\|R'/ );
    assert.throws( () => parseNotes( 'l !.' ), /rest cannot carry an accent/ );
} );
