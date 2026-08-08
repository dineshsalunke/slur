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
    if ( session.room ) return { room: session.room };
    const room = await getClient().joinOrCreate<RunState>( ROOM_NAME );
    session.room = room;
    return { room };
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
            <NetCanvas />
        </RoomProvider>
    );
}
