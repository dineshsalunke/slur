import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomList } from '../lobby/room-list';
import { hostRoom, joinLobby, joinRoom } from '../net/matchmaking';
import type { Route } from './+types/home';
import { LandingScene } from './home/landing-scene';

const NAME_KEY = 'slur:name';

export function meta( _args: Route.MetaArgs ) {
    return [ { title: 'SLUR' }, { name: 'description', content: 'Multiplayer party ship-racer' } ];
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
        <Fragment>
            { /* Ambient Grid-Void backdrop: a position:fixed Canvas the front-of-house UI overlays. */ }
            <LandingScene />
            <div className="scrim" />

            <main className="stage">
                <header className="topbar">
                    <div className="brand">
                        <h1 className="wordmark">SLUR</h1>
                        <span className="tagline">Multiplayer Ship-Racer</span>
                    </div>
                </header>

                <section className="landing-body">
                    <div className="lead">
                        <h2>
                            Race your friends. <em>Wreck</em> their run.
                        </h2>
                        <p>
                            Host a room, share the code with your crew, and drop into the next round. Bolts, boosts, and
                            a chase-wall that doesn&apos;t care whose fault it was.
                        </p>
                    </div>

                    <div className="panel console">
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="callsign">Call sign</label>
                                <input
                                    id="callsign"
                                    className="callsign"
                                    type="text"
                                    value={ name }
                                    maxLength={ 16 }
                                    placeholder="Racer"
                                    onChange={ ( e ) => setName( e.target.value ) }
                                />
                            </div>
                            <div className="field field-action">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={ busy }
                                    onClick={ () => enter( ( n ) => hostRoom( n ) ) }
                                >
                                    Host a run ▸
                                </button>
                            </div>
                        </div>

                        <RoomList busy={ busy } onJoin={ ( roomId ) => enter( ( n ) => joinRoom( roomId, n ) ) } />
                    </div>
                </section>
            </main>
        </Fragment>
    );
}
