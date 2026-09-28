import { MatchMakeError } from '@colyseus/sdk';
import { KICKED_CODE, normalizeRoomCode } from '@slur/shared';
import { redirect } from 'react-router';
import { GameShell } from '../../game/game-shell';
import { joinByLink, waitForDescriptor } from '../../net/matchmaking';
import { RoomProvider } from '../../net/room-context/room-context';
import { NAME_KEY } from '../home/call-sign-field/call-sign-field.constants';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Run' }, { name: 'description', content: 'Networked flight' } ];
}

export async function clientLoader( { params }: Route.ClientLoaderArgs ) {
    const code = normalizeRoomCode( params.roomId );
    if ( ! code ) throw redirect( '/?run=closed' );
    if ( code !== params.roomId ) throw redirect( `/game/${ code }` );
    const name = localStorage.getItem( NAME_KEY )?.trim() || 'Racer';
    try {
        const room = await joinByLink( code, name );
        const descriptor = await waitForDescriptor( room );
        return { room, descriptor };
    } catch ( error ) {
        const removed = error instanceof MatchMakeError && error.code === KICKED_CODE;
        throw redirect( removed ? '/?run=removed' : '/?run=closed' );
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
