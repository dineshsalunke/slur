import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { connectionStatus } from './connection-status';
import { hostRoom, joinByLink, joinLobby, joinRoom, leaveRoom, waitForDescriptor } from './matchmaking';
import { session } from './session';

const client = vi.hoisted( () => ( {
    create: vi.fn(),
    joinById: vi.fn(),
    joinOrCreate: vi.fn(),
} ) );

vi.mock( './client', () => ( { getClient: () => client } ) );
vi.mock( '../lobby/lobby-store', () => ( { attachLobbyStore: vi.fn() } ) );
vi.mock( '../ship/ship-choice', () => ( { currentShip: () => ( { id: 'freighter' } ) } ) );

interface Descriptor {
    kind: string;
    seed?: number;
    tier?: number;
    length?: number;
    levelId?: string;
    blockDensity?: number;
    gapChance?: number;
    gen?: string;
}

function makeRoom( descriptor?: Descriptor ) {
    const handlers = new Set< () => void >();
    const onStateChange = ( ( h: () => void ): void => {
        handlers.add( h );
    } ) as ( ( h: () => void ) => void ) & { remove: ( h: () => void ) => void };
    onStateChange.remove = ( h: () => void ): void => {
        handlers.delete( h );
    };
    const room = { state: { descriptor }, onStateChange };
    return {
        room: room as unknown as Room< RunState >,
        emit: (): void => {
            for ( const h of [ ...handlers ] ) h();
        },
        setDescriptor: ( d?: Descriptor ): void => {
            room.state.descriptor = d;
        },
        handlerCount: (): number => handlers.size,
    };
}

function signal< A extends unknown[] >() {
    const handlers: ( ( ...args: A ) => void )[] = [];
    const on = ( h: ( ...args: A ) => void ): void => {
        handlers.push( h );
    };
    const fire = ( ...args: A ): void => {
        for ( const h of handlers ) h( ...args );
    };
    return { on, fire };
}

function fakeRoom( roomId: string ) {
    const leave = signal< [ number ] >();
    const drop = signal< [ number ] >();
    const reconnect = signal< [] >();
    const room = {
        roomId,
        send: vi.fn(),
        leave: vi.fn( () => {
            leave.fire( 4000 );
            return Promise.resolve( 4000 );
        } ),
        onLeave: leave.on,
        onDrop: drop.on,
        onReconnect: reconnect.on,
    };
    return {
        room,
        typed: room as unknown as Room< RunState >,
        serverLeaves: (): void => leave.fire( 4003 ),
        drops: (): void => drop.fire( 1006 ),
        reconnects: (): void => reconnect.fire(),
    };
}

function deferred< T >() {
    let resolve!: ( value: T ) => void;
    const promise = new Promise< T >( ( r ) => {
        resolve = r;
    } );
    return { promise, resolve };
}

const READY = { kind: 'procgen', seed: 12345, tier: 0, length: 400, blockDensity: 1, gapChance: 1, gen: 'weave' };
const PENDING = { ...READY, seed: 0 };
const RESOLVED = { kind: 'procgen', seed: 12345, tier: 0, length: 400, blockDensity: 1, gapChance: 1, gen: 'weave' };

describe( 'waitForDescriptor', () => {
    it( 'resolves immediately when the descriptor is already present and ready', async () => {
        const { room } = makeRoom( READY );
        await expect( waitForDescriptor( room ) ).resolves.toEqual( RESOLVED );
    } );

    it( 'starts undefined without throwing and stays pending until a ready descriptor arrives', async () => {
        const { room, emit, setDescriptor, handlerCount } = makeRoom( undefined );
        let resolved: unknown = null;
        const done = waitForDescriptor( room ).then( ( d ) => {
            resolved = d;
        } );

        expect( handlerCount() ).toBe( 1 );
        emit();
        expect( resolved ).toBeNull();

        setDescriptor( PENDING );
        emit();
        expect( resolved ).toBeNull();

        setDescriptor( READY );
        emit();
        await done;
        expect( resolved ).toEqual( RESOLVED );
    } );

    it( 'removes its state-change handler once resolved (no leak)', async () => {
        const { room, emit, setDescriptor, handlerCount } = makeRoom( undefined );
        const done = waitForDescriptor( room );
        setDescriptor( READY );
        emit();
        await done;
        expect( handlerCount() ).toBe( 0 );
    } );
} );

describe( 'room lifetime (#271)', () => {
    beforeEach( () => {
        leaveRoom();
        client.create.mockReset();
        client.joinById.mockReset();
        client.joinOrCreate.mockReset();
    } );

    it( 'leaves the previous room when hosting a new one', async () => {
        const first = fakeRoom( 'a' );
        const second = fakeRoom( 'b' );
        client.create.mockResolvedValueOnce( first.typed ).mockResolvedValueOnce( second.typed );

        await hostRoom( 'p' );
        await hostRoom( 'p' );

        expect( first.room.leave ).toHaveBeenCalledOnce();
        expect( second.room.leave ).not.toHaveBeenCalled();
        expect( session.room ).toBe( second.typed );
    } );

    it( 'a consented leave clears the room without reporting a lost connection', async () => {
        const run = fakeRoom( 'a' );
        client.joinById.mockResolvedValueOnce( run.typed );
        await joinRoom( 'a', 'p' );

        leaveRoom();

        expect( run.room.leave ).toHaveBeenCalledOnce();
        expect( session.room ).toBeNull();
        expect( connectionStatus() ).toBe( 'live' );
    } );

    it( 'reports reconnecting on a drop and live again on reconnect', async () => {
        const run = fakeRoom( 'a' );
        client.joinById.mockResolvedValueOnce( run.typed );
        await joinRoom( 'a', 'p' );

        run.drops();
        expect( connectionStatus() ).toBe( 'reconnecting' );
        run.reconnects();
        expect( connectionStatus() ).toBe( 'live' );
        expect( session.room ).toBe( run.typed );
    } );

    it( 'a server-side leave clears the room, reports lost, and the link joins afresh', async () => {
        const dead = fakeRoom( 'a' );
        const fresh = fakeRoom( 'a' );
        client.joinById.mockResolvedValueOnce( dead.typed ).mockResolvedValueOnce( fresh.typed );
        await joinByLink( 'a', 'p' );

        dead.serverLeaves();
        expect( session.room ).toBeNull();
        expect( connectionStatus() ).toBe( 'lost' );

        await expect( joinByLink( 'a', 'p' ) ).resolves.toBe( fresh.typed );
        expect( client.joinById ).toHaveBeenCalledTimes( 2 );
        expect( connectionStatus() ).toBe( 'live' );
    } );

    it( 'leaves a room whose join finishes after the player already left', async () => {
        const late = fakeRoom( 'a' );
        const joining = deferred< Room< RunState > >();
        client.joinById.mockReturnValueOnce( joining.promise );

        const pending = joinByLink( 'a', 'p' );
        leaveRoom();
        joining.resolve( late.typed );

        await expect( pending ).rejects.toThrow();
        expect( late.room.leave ).toHaveBeenCalledOnce();
        expect( session.room ).toBeNull();
    } );
} );

describe( 'joinLobby (#271)', () => {
    it( 'joins once for concurrent calls and joins again after the lobby leaves', async () => {
        const lobby = fakeRoom( 'lobby' );
        const next = fakeRoom( 'lobby' );
        client.joinOrCreate.mockResolvedValueOnce( lobby.room ).mockResolvedValueOnce( next.room );

        await Promise.all( [ joinLobby(), joinLobby() ] );
        expect( client.joinOrCreate ).toHaveBeenCalledOnce();

        lobby.serverLeaves();
        expect( session.lobby ).toBeNull();

        await joinLobby();
        expect( client.joinOrCreate ).toHaveBeenCalledTimes( 2 );
        expect( session.lobby ).toBe( next.room );
    } );
} );
