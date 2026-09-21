import { redirect } from 'react-router';
import { GameShell } from '../../game/game-shell';
import { waitForDescriptor } from '../../net/matchmaking';
import { RoomProvider } from '../../net/room-context';
import { session } from '../../net/session';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Run' }, { name: 'description', content: 'Networked flight' } ];
}

export async function clientLoader( { params }: Route.ClientLoaderArgs ) {
    const room = session.room;
    if ( ! room || room.roomId !== params.roomId ) throw redirect( '/' );
    const descriptor = await waitForDescriptor( room );
    return { room, descriptor };
}

export function shouldRevalidate() {
    return false;
}

export default function Game( { loaderData }: Route.ComponentProps ) {
    return (
        <RoomProvider room={ loaderData.room }>
            <GameShell descriptor={ loaderData.descriptor } />
        </RoomProvider>
    );
}
