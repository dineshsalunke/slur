import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CREATE_LIMIT_CODE, ROOM_NAME, SERVER_FULL_CODE } from '@slur/shared';
import { CreateQuota } from './create-quota.js';
import {
    CREATE_WINDOW_MS,
    MAX_CREATES_PER_WINDOW,
    MAX_LIVE_ROOMS_PER_IP,
    MAX_ROOMS,
    SEAT_RESERVATION_SECONDS,
} from './limits.js';

const SEAT_MS = SEAT_RESERVATION_SECONDS * 1000;

function create( ip: string, method = 'create', roomName = ROOM_NAME ) {
    return { method, roomName, ip };
}

function createAndOwn( quota: CreateQuota, ip: string, roomId: string, nowMs: number ): void {
    quota.admit( create( ip ), nowMs );
    quota.opened( roomId );
    quota.owned( roomId, ip, nowMs );
}

describe( 'CreateQuota (#339)', () => {
    test( 'refuses a create past the live-room cap for one address', () => {
        const quota = new CreateQuota();
        for ( let i = 0; i < MAX_LIVE_ROOMS_PER_IP; i++ ) createAndOwn( quota, '1.1.1.1', `R${ i }`, 0 );
        assert.throws( () => quota.admit( create( '1.1.1.1' ), 1 ), { code: CREATE_LIMIT_CODE } );
        assert.doesNotThrow( () => quota.admit( create( '2.2.2.2' ), 1 ) );
    } );

    test( 'a closed room frees its owner a slot', () => {
        const quota = new CreateQuota();
        for ( let i = 0; i < MAX_LIVE_ROOMS_PER_IP; i++ ) createAndOwn( quota, '1.1.1.1', `R${ i }`, 0 );
        quota.closed( 'R0' );
        assert.doesNotThrow( () => quota.admit( create( '1.1.1.1' ), 1 ) );
    } );

    test( 'a create nobody joins holds a slot until the seat reservation ends', () => {
        const quota = new CreateQuota();
        for ( let i = 0; i < MAX_LIVE_ROOMS_PER_IP; i++ ) quota.admit( create( '1.1.1.1' ), 0 );
        assert.equal( quota.liveFor( '1.1.1.1', 0 ), MAX_LIVE_ROOMS_PER_IP );
        assert.throws( () => quota.admit( create( '1.1.1.1' ), 1 ), { code: CREATE_LIMIT_CODE } );
        assert.equal( quota.liveFor( '1.1.1.1', SEAT_MS ), 0 );
        assert.doesNotThrow( () => quota.admit( create( '1.1.1.1' ), SEAT_MS ) );
    } );

    test( 'owning a room swaps its pending create for the room, never counting both', () => {
        const quota = new CreateQuota();
        createAndOwn( quota, '1.1.1.1', 'R0', 0 );
        assert.equal( quota.liveFor( '1.1.1.1', 0 ), 1 );
        quota.owned( 'R0', '9.9.9.9', 0 );
        assert.equal( quota.liveFor( '9.9.9.9', 0 ), 0, 'only the first joiner owns a room' );
    } );

    test( 'refuses a create past the window cap even when rooms closed', () => {
        const quota = new CreateQuota();
        for ( let i = 0; i < MAX_CREATES_PER_WINDOW; i++ ) {
            createAndOwn( quota, '1.1.1.1', `R${ i }`, i );
            quota.closed( `R${ i }` );
        }
        assert.throws( () => quota.admit( create( '1.1.1.1' ), SEAT_MS ), { code: CREATE_LIMIT_CODE } );
        assert.doesNotThrow( () => quota.admit( create( '1.1.1.1' ), CREATE_WINDOW_MS + MAX_CREATES_PER_WINDOW ) );
    } );

    test( 'refuses every create once the server holds the room cap', () => {
        const quota = new CreateQuota();
        for ( let i = 0; i < MAX_ROOMS; i++ ) quota.opened( `R${ i }` );
        assert.equal( quota.full(), true );
        assert.throws( () => quota.admit( create( '3.3.3.3' ), 0 ), { code: SERVER_FULL_CODE } );
        quota.closed( 'R0' );
        assert.equal( quota.full(), false );
    } );

    test( 'counts joinOrCreate only when it would create, and ignores other rooms and joins', () => {
        let publicOpen = false;
        const quota = new CreateQuota( () => publicOpen );
        for ( let i = 0; i < MAX_LIVE_ROOMS_PER_IP; i++ ) quota.admit( create( '1.1.1.1' ), 0 );
        assert.throws( () => quota.admit( create( '1.1.1.1', 'joinOrCreate' ), 0 ), { code: CREATE_LIMIT_CODE } );
        publicOpen = true;
        assert.doesNotThrow( () => quota.admit( create( '1.1.1.1', 'joinOrCreate' ), 0 ) );
        assert.doesNotThrow( () => quota.admit( create( '1.1.1.1', 'joinById' ), 0 ) );
        assert.doesNotThrow( () => quota.admit( create( '1.1.1.1', 'create', 'lobby' ), 0 ) );
    } );

    test( 'forgets addresses whose windows have passed', () => {
        const quota = new CreateQuota();
        quota.admit( create( '1.1.1.1' ), 0 );
        assert.equal( quota.tracked(), 2 );
        assert.equal( quota.liveFor( '1.1.1.1', SEAT_MS ), 0 );
        assert.equal( quota.tracked(), 1 );
    } );
} );
