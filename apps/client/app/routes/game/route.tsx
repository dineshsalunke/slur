import { redirect } from 'react-router';
import { GameShell } from '../../game/game-shell';
import { joinByLink, waitForDescriptor } from '../../net/matchmaking';
import { RoomProvider } from '../../net/room-context';
import { NAME_KEY } from '../home/call-sign-field';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Run' }, { name: 'description', content: 'Networked flight' } ];
}

export async function clientLoader( { params }: Route.ClientLoaderArgs ) {
    const name = localStorage.getItem( NAME_KEY )?.trim() || 'Racer';
    try {
        const room = await joinByLink( params.roomId, name );
        const descriptor = await waitForDescriptor( room );
        return { room, descriptor };
    } catch {
        throw redirect( '/?run=closed' );
    }
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
