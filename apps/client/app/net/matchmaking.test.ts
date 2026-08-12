import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { waitForDescriptor } from './matchmaking';

// A minimal stand-in for the parts of Room<RunState> that waitForDescriptor touches: a mutable `state`, and
// an `onStateChange` that is CALLABLE (register a handler) with a `.remove` (deregister) — the @colyseus/sdk
// shape. `emit()` fires every registered handler, standing in for a decoded state patch landing over the wire;
// `setDescriptor` mutates what the next patch will carry. We drive these by hand so the async ordering the
// real footgun is about (join resolves BEFORE the descriptor patch decodes) is reproduced deterministically.
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

// procgen: descriptorReady is `seed !== 0`, so seed 0 = present-but-not-ready, a real non-zero seed = ready.
const READY = { kind: 'procgen', seed: 12345, tier: 0, length: 400 };
const PENDING = { kind: 'procgen', seed: 0, tier: 0, length: 400 };
const RESOLVED = { kind: 'procgen', seed: 12345, tier: 0, length: 400 }; // toDescriptor's plain shape

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

        expect( handlerCount() ).toBe( 1 ); // subscribed and waiting — undefined state did NOT throw
        emit(); // a patch lands with descriptor STILL undefined
        expect( resolved ).toBeNull(); // must not resolve on an absent descriptor

        setDescriptor( PENDING );
        emit(); // descriptor now present but seed 0 → not ready
        expect( resolved ).toBeNull(); // must not resolve until descriptorReady

        setDescriptor( READY );
        emit(); // ready at last
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
