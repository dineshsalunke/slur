import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { waitForDescriptor } from './matchmaking';

interface Descriptor {
    kind: string;
    seed?: number;
    tier?: number;
    length?: number;
    levelId?: string;
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

const READY = { kind: 'procgen', seed: 12345, tier: 0, length: 400 };
const PENDING = { kind: 'procgen', seed: 0, tier: 0, length: 400 };
const RESOLVED = { kind: 'procgen', seed: 12345, tier: 0, length: 400 };

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
