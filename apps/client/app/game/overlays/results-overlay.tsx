import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment } from 'react';
import { Scrim } from '../../ui/scrim';
import { LeaveButton } from './leave-button';
import { RaceAgain } from './race-again/race-again';
import { Standings } from './standings';
import { WinnerCard } from './winner-card';
import { YourFinish } from './your-finish';

export function ResultsOverlay( { room }: { room: Room< RunState > } ) {
    return (
        <Fragment>
            <Scrim />
            <div className="fixed inset-0 z-35 flex flex-col font-readout text-readout selection:bg-marigold selection:text-deep">
                <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-7">
                    <h1 className="m-0 text-[20px] font-bold tracking-[0.42em] text-readout text-shadow-readout">
                        SLUR
                    </h1>
                    <LeaveButton tone="ghost" />
                </header>

                <div className="mt-auto grid gap-5 px-5 pb-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end lg:gap-10">
                    <WinnerCard room={ room } />
                    <Standings room={ room } />
                </div>

                <section
                    aria-label="Your finish"
                    className="border-t border-readout/15 bg-space px-5 py-4 shadow-strip sm:px-10 sm:py-5"
                >
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[auto_auto_1fr] sm:gap-10">
                        <YourFinish room={ room } />
                        <RaceAgain room={ room } />
                    </div>
                </section>
            </div>
        </Fragment>
    );
}
