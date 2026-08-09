import { redirect } from 'react-router';
import { GameShell } from '../../game/game-shell';
import { waitForSeed } from '../../net/matchmaking';
import { RoomProvider } from '../../net/room-context';
import { session } from '../../net/session';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Run' }, { name: 'description', content: 'Networked flight' } ];
}

// requireRoom guard. The room is created/joined in the landing's Host/Join HANDLERS (never in a loader — a
// loader must not open a socket; that was the S2 bug). This loader only VERIFIES a live room exists for this
// id — a cold deep-link / stale id → back to the landing — then waits for the server seed to decode so
// NetCanvas builds a track matching the server from its first render.
export async function clientLoader( { params }: Route.ClientLoaderArgs ) {
    const room = session.room;
    if ( ! room || room.roomId !== params.roomId ) throw redirect( '/' );
    const seed = await waitForSeed( room );
    return { room, seed };
}

// A param-less-content gameplay route must never re-run the loader (it would re-guard mid-match). The room
// lives on the session singleton, not loader data flow.
export function shouldRevalidate() {
    return false;
}

export default function Game( { loaderData }: Route.ComponentProps ) {
    return (
        <RoomProvider room={ loaderData.room }>
            <GameShell seed={ loaderData.seed } />
        </RoomProvider>
    );
}
