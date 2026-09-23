import { isShipId, SET_CLASS_MESSAGE } from '@slur/shared';
import { Fragment } from 'react';
import { redirect } from 'react-router';
import { RoomList } from '../lobby/room-list';
import { hostRoom, joinLobby, joinRoom } from '../net/matchmaking';
import { Scrim } from '../ui/scrim';
import type { Route } from './+types/home';
import { NAME_KEY } from './home/call-sign-field';
import { LandingScene } from './home/landing-scene';
import { MENU_FORM } from './home/menu-form';
import { MenuStrip } from './home/menu-strip';

export function meta( _args: Route.MetaArgs ) {
    return [
        { title: 'SLUR' },
        { name: 'description', content: 'Race your friends. Wreck their run. A party ship-racer in the browser.' },
    ];
}

export async function clientLoader() {
    await joinLobby();
    return { savedName: localStorage.getItem( NAME_KEY ) ?? '' };
}

export async function clientAction( { request }: Route.ClientActionArgs ) {
    const form = await request.formData();
    const name = String( form.get( 'name' ) ?? '' ).trim() || 'Racer';
    const ship = form.get( 'ship' );
    const join = form.get( 'join' );
    localStorage.setItem( NAME_KEY, name );
    try {
        const room = typeof join === 'string' && join ? await joinRoom( join, name ) : await hostRoom( name );
        if ( isShipId( ship ) ) room.send( SET_CLASS_MESSAGE, ship );
        return redirect( `/game/${ room.roomId }` );
    } catch {
        return {
            error: join
                ? 'That run has closed. Pick another, or host your own.'
                : 'Could not reach the server. Check the connection and try again.',
        };
    }
}

export default function Home( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            <LandingScene />
            <Scrim />

            <main className="relative z-[2] flex min-h-dvh flex-col font-readout text-readout selection:bg-marigold selection:text-deep">
                <header className="px-5 pt-5 sm:px-10 sm:pt-7">
                    <h1 className="m-0 text-[20px] font-bold tracking-[0.42em] text-readout text-shadow-readout">
                        SLUR
                    </h1>
                </header>

                <div className="mt-auto flex flex-col gap-6 px-5 pb-6 pt-10 sm:px-10 sm:pb-7">
                    <section aria-labelledby="pitch">
                        <h2
                            id="pitch"
                            className="m-0 max-w-[16ch] text-balance text-[clamp(34px,5vw,64px)] font-bold uppercase leading-[0.95] tracking-[0.01em] text-shadow-readout"
                        >
                            Race your friends. Wreck their run.
                        </h2>
                        <p className="m-0 mt-3 max-w-[60ch] text-[16px] leading-[1.5] text-readout text-shadow-readout">
                            Host a room, share the code with your crew, and drop into the next round.
                        </p>
                    </section>
                    <RoomList form={ MENU_FORM } />
                </div>

                <MenuStrip savedName={ loaderData.savedName } />
            </main>
        </Fragment>
    );
}
