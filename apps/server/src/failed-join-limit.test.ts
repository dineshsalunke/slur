import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErrorCode, ServerError } from '@colyseus/core';
import { TOO_MANY_WRONG_CODES_CODE } from '@slur/shared';
import {
    FAILED_JOIN_LIMIT,
    FAILED_JOIN_SWEEP_SIZE,
    FAILED_JOIN_WINDOW_MS,
    FailedJoinLimit,
} from './failed-join-limit.js';

const join = ( ip: string ) => ( { method: 'joinById', roomName: 'K7QXM', ip } );
const notFound = new ServerError( ErrorCode.MATCHMAKE_INVALID_ROOM_ID, 'room "K7QXM" not found' );

function fail( limit: FailedJoinLimit, ip: string, count: number, nowMs: number ): void {
    for ( let i = 0; i < count; i++ ) limit.failed( join( ip ), notFound, nowMs );
}

test( 'failed joins: the limit admits FAILED_JOIN_LIMIT wrong codes, then refuses the next with 429', () => {
    const limit = new FailedJoinLimit();
    fail( limit, 'a', FAILED_JOIN_LIMIT - 1, 0 );
    assert.doesNotThrow( () => limit.admit( join( 'a' ), 0 ) );
    fail( limit, 'a', 1, 0 );
    assert.throws( () => limit.admit( join( 'a' ), 0 ), { code: TOO_MANY_WRONG_CODES_CODE } );
} );

test( 'failed joins: the limit is per IP', () => {
    const limit = new FailedJoinLimit();
    fail( limit, 'a', FAILED_JOIN_LIMIT, 0 );
    assert.doesNotThrow( () => limit.admit( join( 'b' ), 0 ) );
} );

test( 'failed joins: the window slides; the oldest failure leaves after FAILED_JOIN_WINDOW_MS', () => {
    const limit = new FailedJoinLimit();
    fail( limit, 'a', 1, 0 );
    fail( limit, 'a', FAILED_JOIN_LIMIT - 1, 1000 );
    assert.throws( () => limit.admit( join( 'a' ), FAILED_JOIN_WINDOW_MS - 1 ) );
    assert.doesNotThrow( () => limit.admit( join( 'a' ), FAILED_JOIN_WINDOW_MS ) );
} );

test( 'failed joins: only a not-found joinById counts', () => {
    const limit = new FailedJoinLimit();
    for ( let i = 0; i < FAILED_JOIN_LIMIT; i++ ) {
        limit.failed( { ...join( 'a' ), method: 'create' }, notFound, 0 );
        limit.failed( join( 'a' ), new ServerError( 500, 'boom' ), 0 );
        limit.failed( join( 'a' ), new Error( 'network' ), 0 );
    }
    assert.doesNotThrow( () => limit.admit( join( 'a' ), 0 ) );
} );

test( 'failed joins: other methods are never refused', () => {
    const limit = new FailedJoinLimit();
    fail( limit, 'a', FAILED_JOIN_LIMIT, 0 );
    assert.doesNotThrow( () => limit.admit( { ...join( 'a' ), method: 'joinOrCreate' }, 0 ) );
    assert.doesNotThrow( () => limit.admit( { ...join( 'a' ), method: 'reconnect' }, 0 ) );
} );

test( 'failed joins: stale IPs are swept once the table is full', () => {
    const limit = new FailedJoinLimit();
    for ( let i = 0; i < FAILED_JOIN_SWEEP_SIZE; i++ ) fail( limit, `ip${ i }`, 1, 0 );
    assert.equal( limit.tracked(), FAILED_JOIN_SWEEP_SIZE );
    fail( limit, 'late', 1, FAILED_JOIN_WINDOW_MS );
    assert.equal( limit.tracked(), 1 );
} );
