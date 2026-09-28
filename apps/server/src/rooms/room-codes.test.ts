import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeRoomCode } from '@slur/shared';
import { RoomCodes } from './room-codes.js';

test( 'room codes: a claimed code is well-formed', () => {
    const code = new RoomCodes().claim();
    assert.equal( normalizeRoomCode( code ), code );
} );

test( 'room codes: a live code is never handed out twice', () => {
    const draws = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ];
    const codes = new RoomCodes( () => draws.shift() ?? 0 );
    assert.equal( codes.claim(), '22222' );
    assert.equal( codes.claim(), '33333' );
} );

test( 'room codes: a released code can be handed out again', () => {
    const codes = new RoomCodes( () => 0 );
    const code = codes.claim();
    codes.release( code );
    assert.equal( codes.claim(), code );
} );

test( 'room codes: at most one public room, and its release frees the slot', () => {
    const codes = new RoomCodes();
    const first = codes.claim();
    const second = codes.claim();
    assert.equal( codes.claimPublic( first ), true );
    assert.equal( codes.claimPublic( second ), false );
    assert.equal( codes.publicRoom(), first );
    codes.release( second );
    assert.equal( codes.publicRoom(), first );
    codes.release( first );
    assert.equal( codes.publicRoom(), null );
    assert.equal( codes.claimPublic( second ), true );
} );
