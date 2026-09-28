import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPublicCreate, makeRoomCode, normalizeRoomCode, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './room-code.js';

test( 'room code: the alphabet has no look-alikes and no vowels', () => {
    for ( const c of '01OILAEU' ) assert.ok( ! ROOM_CODE_ALPHABET.includes( c ), c );
    assert.equal( new Set( ROOM_CODE_ALPHABET ).size, ROOM_CODE_ALPHABET.length );
    assert.equal( ROOM_CODE_ALPHABET.length ** ROOM_CODE_LENGTH, 17_210_368 );
} );

test( 'room code: makeRoomCode picks one alphabet symbol per slot', () => {
    assert.equal(
        makeRoomCode( () => 0 ),
        '22222',
    );
    assert.equal(
        makeRoomCode( ( size ) => size - 1 ),
        'ZZZZZ',
    );
    let i = 0;
    assert.equal(
        makeRoomCode( () => i++ ),
        '23456',
    );
} );

test( 'room code: normalize trims and upper-cases a well-formed code', () => {
    assert.equal( normalizeRoomCode( ' k7qxm ' ), 'K7QXM' );
    assert.equal( normalizeRoomCode( 'K7QXM' ), 'K7QXM' );
} );

test( 'room code: normalize rejects wrong length, banned symbols and non-strings', () => {
    assert.equal( normalizeRoomCode( 'K7QX' ), null );
    assert.equal( normalizeRoomCode( 'K7QXMM' ), null );
    assert.equal( normalizeRoomCode( 'K0QXM' ), null );
    assert.equal( normalizeRoomCode( 'KAQXM' ), null );
    assert.equal( normalizeRoomCode( 'aB3dEf9Gh' ), null );
    assert.equal( normalizeRoomCode( 12345 ), null );
    assert.equal( normalizeRoomCode( undefined ), null );
} );

test( 'room code: only an explicit public: true asks for the public room', () => {
    assert.equal( isPublicCreate( { public: true } ), true );
    assert.equal( isPublicCreate( { public: 'true' } ), false );
    assert.equal( isPublicCreate( {} ), false );
    assert.equal( isPublicCreate( undefined ), false );
    assert.equal( isPublicCreate( null ), false );
} );
