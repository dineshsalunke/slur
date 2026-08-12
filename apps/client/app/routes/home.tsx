import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomList } from '../lobby/room-list';
import { hostRoom, joinLobby, joinRoom } from '../net/matchmaking';
import { Button } from '../ui/button';
import { Panel } from '../ui/panel';
import { Scrim } from '../ui/scrim';
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
            <Scrim />

            <main className="relative z-[2] grid min-h-screen grid-rows-[auto_1fr]">
                <header className="flex items-center justify-between gap-4 px-7 py-[22px]">
                    <div className="flex items-baseline gap-3">
                        <h1 className="ml-[0.42em] text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[0.42em] text-[#eaf6ff] text-shadow-wordmark">
                            SLUR
                        </h1>
                        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-dim">
                            Multiplayer Ship-Racer
                        </span>
                    </div>
                </header>

                <section className="grid h-full content-end justify-start px-7 pb-11">
                    <div className="mb-[26px] max-w-[540px]">
                        <h2 className="mb-3 text-balance text-[clamp(28px,4vw,46px)] font-bold leading-[1.04] text-[#f3f8ff]">
                            Race your friends. <em className="not-italic text-marigold text-shadow-wreck">Wreck</em>{ ' ' }
                            their run.
                        </h2>
                        <p className="m-0 max-w-[46ch] text-[15px] leading-[1.5] text-dim">
                            Host a room, share the code with your crew, and drop into the next round. Bolts, boosts, and
                            a chase-wall that doesn&apos;t care whose fault it was.
                        </p>
                    </div>

                    <Panel className="w-[min(560px,92vw)]">
                        <div className="flex items-stretch gap-2.5">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <label
                                    htmlFor="callsign"
                                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-dim"
                                >
                                    Call sign
                                </label>
                                <input
                                    id="callsign"
                                    className="rounded-[2px] border border-line-2 bg-black/35 px-3.5 py-3 font-mono text-[15px] text-fg outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-cyan focus:shadow-focus"
                                    type="text"
                                    value={ name }
                                    maxLength={ 16 }
                                    placeholder="Racer"
                                    onChange={ ( e ) => setName( e.target.value ) }
                                />
                            </div>
                            <div className="flex flex-none flex-col justify-end">
                                <Button
                                    variant="primary"
                                    disabled={ busy }
                                    onClick={ () => enter( ( n ) => hostRoom( n ) ) }
                                >
                                    Host a run ▸
                                </Button>
                            </div>
                        </div>

                        <RoomList busy={ busy } onJoin={ ( roomId ) => enter( ( n ) => joinRoom( roomId, n ) ) } />
                    </Panel>
                </section>
            </main>
        </Fragment>
    );
}
