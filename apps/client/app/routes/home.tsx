import { normalizeRoomCode } from '@slur/shared';
import { Fragment } from 'react';
import { redirect } from 'react-router';
import { createPrivate, joinLobby, joinRoom, leaveRoom, quickPlay } from '../net/matchmaking';
import { FullscreenToggle } from '../ui/fullscreen-toggle/fullscreen-toggle';
import { HomeScreenHint } from '../ui/home-screen-hint/home-screen-hint';
import { homeScreenHintDue } from '../ui/home-screen-hint/home-screen-hint.utils';
import { Scrim } from '../ui/scrim';
import type { Route } from './+types/home';
import { NAME_KEY } from './home/call-sign-field/call-sign-field.constants';
import { LandingBackdrop } from './home/landing-backdrop/landing-backdrop';
import { BAD_CODE, NO_CODE, REMOVED, RUN_CLOSED } from './home/menu-form';
import { menuErrorFor, menuIntent } from './home/menu-form.utils';
import { MenuStrip } from './home/menu-strip/menu-strip';

export function meta( _args: Route.MetaArgs ) {
    return [
        { title: 'SLUR' },
        { name: 'description', content: 'Race your friends. Wreck their run. A party ship-racer in the browser.' },
    ];
}

export function clientLoader( { request }: Route.ClientLoaderArgs ) {
    leaveRoom();
    joinLobby().catch( () => {} );
    const run = new URL( request.url ).searchParams.get( 'run' );
    const notice = run === 'closed' ? RUN_CLOSED : run === 'removed' ? REMOVED : null;
    return { savedName: localStorage.getItem( NAME_KEY ) ?? '', notice, homeScreenHint: homeScreenHintDue() };
}

export async function clientAction( { request }: Route.ClientActionArgs ) {
    const form = await request.formData();
    const name = String( form.get( 'name' ) ?? '' ).trim() || 'Racer';
    const intent = menuIntent( form.get( 'intent' ) );
    const typed = String( form.get( 'code' ) ?? '' ).trim();
    const code = normalizeRoomCode( typed );
    localStorage.setItem( NAME_KEY, name );
    if ( intent === 'join' && ! code ) return { error: typed ? BAD_CODE : NO_CODE };
    try {
        const room =
            intent === 'join' && code
                ? await joinRoom( code, name )
                : intent === 'quick'
                  ? await quickPlay( name )
                  : await createPrivate( name );
        return redirect( `/game/${ room.roomId }` );
    } catch ( error ) {
        return { error: menuErrorFor( intent, code ?? typed, error ) };
    }
}

export default function Home( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            <LandingBackdrop />
            <Scrim />

            <main className="relative z-[2] flex min-h-dvh flex-col font-readout text-readout selection:bg-marigold selection:text-deep">
                <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-7">
                    <h1 className="m-0 text-[20px] font-bold tracking-[0.42em] text-readout text-shadow-readout">
                        SLUR
                    </h1>
                    <div className="flex items-start gap-2">
                        <HomeScreenHint due={ loaderData.homeScreenHint } />
                        <FullscreenToggle />
                    </div>
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
                            Create a room and send your crew the code, or drop into quick play.
                        </p>
                    </section>
                </div>

                <MenuStrip savedName={ loaderData.savedName } />
            </main>
        </Fragment>
    );
}
