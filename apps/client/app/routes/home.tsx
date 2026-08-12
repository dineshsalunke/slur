import { Fragment } from 'react';
import { joinLobby } from '../net/matchmaking';
import { Scrim } from '../ui/scrim';
import type { Route } from './+types/home';
import { CallSignConsole, NAME_KEY } from './home/call-sign-console';
import { LandingScene } from './home/landing-scene';

export function meta( _args: Route.MetaArgs ) {
    return [ { title: 'SLUR' }, { name: 'description', content: 'Multiplayer party ship-racer' } ];
}

// clientLoader: join the live room list (idempotent — the lobby is a session singleton) and read the saved
// display name. Browser-only (clientLoader), so localStorage is safe here, not at module top (SSR-safe root).
export async function clientLoader() {
    await joinLobby();
    return { savedName: localStorage.getItem( NAME_KEY ) ?? '' };
}

// Holds ZERO reactive state, deliberately — it is the parent of the <LandingScene/> R3F Canvas, and
// non-negotiable #10 (r3f.md "Componentize by subscription boundary") says a parent that wraps a Canvas
// sibling must not subscribe to anything. The call-sign field and its state live in <CallSignConsole/>, so
// typing re-renders that leaf alone and never reaches the scene graph. `savedName` is a one-shot initial
// value from the loader, not a subscription.
export default function Home( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            { /* Ambient Grid-Void backdrop: a position:fixed Canvas the front-of-house UI overlays. */ }
            <LandingScene />
            <Scrim />

            <main className="relative z-[2] grid min-h-screen grid-rows-[auto_1fr]">
                <header className="flex items-center justify-between gap-4 px-7 py-[22px]">
                    <div className="flex items-baseline gap-3">
                        <h1 className="ml-[0.42em] text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[0.42em] text-wordmark text-shadow-wordmark">
                            SLUR
                        </h1>
                        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-dim">
                            Multiplayer Ship-Racer
                        </span>
                    </div>
                </header>

                <section className="grid h-full content-end justify-start px-7 pb-11">
                    <div className="mb-[26px] max-w-[540px]">
                        <h2 className="mb-3 text-balance text-[clamp(28px,4vw,46px)] font-bold leading-[1.04] text-headline">
                            Race your friends. <em className="not-italic text-marigold text-shadow-marigold">Wreck</em>{ ' ' }
                            their run.
                        </h2>
                        <p className="m-0 max-w-[46ch] text-[15px] leading-[1.5] text-dim">
                            Host a room, share the code with your crew, and drop into the next round. Bolts, boosts, and
                            a chase-wall that doesn&apos;t care whose fault it was.
                        </p>
                    </div>

                    <CallSignConsole savedName={ loaderData.savedName } />
                </section>
            </main>
        </Fragment>
    );
}
