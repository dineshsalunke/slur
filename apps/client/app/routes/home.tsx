import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomList } from '../lobby/room-list';
import { hostRoom, joinLobby, joinRoom } from '../net/matchmaking';
import type { Route } from './+types/home';

const NAME_KEY = 'slur:name';

export function meta( _args: Route.MetaArgs ) {
    return [ { title: 'SLUR' }, { name: 'description', content: 'LAN party ship-racer' } ];
}

// clientLoader: join the live room list (idempotent — the lobby is a session singleton) and read the saved
// display name. Browser-only (clientLoader), so localStorage is safe here, not at module top (SSR-safe root).
export async function clientLoader() {
    await joinLobby();
    return { savedName: localStorage.getItem( NAME_KEY ) ?? '' };
}

export default function Home( { loaderData }: Route.ComponentProps ) {
    const navigate = useNavigate();
    const [ name, setName ] = useState( loaderData.savedName );
    const [ busy, setBusy ] = useState( false );

    // Host/Join share this: persist the name, run the matchmaking action (create or joinById), then navigate
    // into the game. On failure, stay on the landing (re-enable the buttons) rather than dead-end.
    const enter = async ( action: ( name: string ) => Promise< Room< RunState > > ) => {
        const clean = name.trim() || 'Racer';
        localStorage.setItem( NAME_KEY, clean );
        setBusy( true );
        try {
            const room = await action( clean );
            navigate( `/game/${ room.roomId }` );
        } catch {
            setBusy( false );
        }
    };

    return (
        <main>
            <h1>SLUR</h1>
            <label>
                Name{ ' ' }
                <input
                    value={ name }
                    maxLength={ 16 }
                    placeholder="Racer"
                    onChange={ ( e ) => setName( e.target.value ) }
                />
            </label>
            <button type="button" disabled={ busy } onClick={ () => enter( ( n ) => hostRoom( n ) ) }>
                Host a run
            </button>
            <RoomList busy={ busy } onJoin={ ( roomId ) => enter( ( n ) => joinRoom( roomId, n ) ) } />
        </main>
    );
}
