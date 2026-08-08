import { getStateCallbacks } from '@colyseus/sdk';
import { ROOM_NAME, type RunState } from '@slur/shared';
import { NetCanvas } from '../../game/net-canvas';
import { getClient } from '../../net/client';
import { RoomProvider } from '../../net/room-context';
import { session } from '../../net/session';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Run' }, { name: 'description', content: 'Networked flight' } ];
}

// Join in the clientLoader (C4): tab 1 creates the default room, tab 2 joins it. Running the join
// here (not in a component effect) gives React Router's pending UI (HydrateFallback) and the
// ErrorBoundary on join failure for free. shouldRevalidate=false: a param-less gameplay route must
// never re-run this and open a second socket.
export async function clientLoader() {
    // Idempotent: the connection lives on the module singleton (OUTSIDE React). A route remount must
    // NEVER re-join — reuse the already-joined room. Only the first visit actually joins. This is why
    // the join lives here and not in a component effect: React lifecycle must not own the socket.
    if ( session.room ) return { room: session.room, seed: session.room.state.seed };
    const room = await getClient().joinOrCreate< RunState >( ROOM_NAME );
    session.room = room;
    // The seed is server-authoritative (set in onCreate) but the decoded state arrives AFTER the join
    // handshake (colyseus.md) — reading room.state.seed here synchronously would be the stale 0 default.
    // Wait for it to decode to a real (non-zero) value, so NetCanvas can build a track that MATCHES the
    // server's from its first render. This is why the seed lives in the loader, not a component effect.
    const seed = await new Promise< number >( ( resolve ) => {
        const off = getStateCallbacks( room )( room.state ).listen( 'seed', ( v ) => {
            if ( v ) {
                off();
                resolve( v );
            }
        } );
    } );
    return { room, seed };
}

export function shouldRevalidate() {
    return false;
}

// Note: in RR8 SPA mode, `HydrateFallback` is only permitted on the root route — so the "Connecting…"
// state is covered by the router's pending navigation (the previous screen stays until join resolves),
// not a route-level fallback. Join failures surface via the root ErrorBoundary.

export default function Run( { loaderData }: Route.ComponentProps ) {
    return (
        <RoomProvider room={ loaderData.room }>
            <NetCanvas seed={ loaderData.seed } />
        </RoomProvider>
    );
}
