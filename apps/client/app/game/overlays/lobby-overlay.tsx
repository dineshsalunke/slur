import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment } from 'react';
import { Scrim } from '../../ui/scrim';
import { ColourSwatches } from './colour-swatches';
import { CopyLink } from './copy-link';
import { LeaveButton } from './leave-button';
import { LobbyShipPicker } from './lobby-ship-picker';
import { RoomTitle } from './room-title';
import { Roster } from './roster';
import { SpecTag } from './spec-tag';
import { StartControl } from './start-control';

export function LobbyOverlay( { room }: { room: Room< RunState > } ) {
    return (
        <Fragment>
            <Scrim />
            <div className="fixed inset-0 z-[2] flex flex-col font-readout text-readout selection:bg-marigold selection:text-deep">
                <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-7">
                    <h1 className="m-0 text-[20px] font-bold tracking-[0.42em] text-readout text-shadow-readout">
                        SLUR
                    </h1>
                    <LeaveButton tone="ghost" />
                </header>

                <div className="mt-auto px-5 pb-6 sm:px-10">
                    <RoomTitle room={ room }>
                        <CopyLink />
                    </RoomTitle>
                </div>

                <div className="flex min-w-0 items-end gap-6 px-5 sm:px-10">
                    <SpecTag className="hidden flex-none sm:block" />
                    <Roster room={ room } className="mb-5 min-w-0 sm:ml-auto" />
                </div>

                <section
                    aria-label="Ship and start"
                    className="border-t border-readout/15 bg-space px-5 py-4 shadow-strip sm:px-10 sm:py-5"
                >
                    <div className="grid gap-4 sm:grid-cols-[17rem_auto_auto] sm:items-end sm:gap-6 lg:grid-cols-[17rem_auto_auto_1fr]">
                        <LobbyShipPicker room={ room } />
                        <ColourSwatches room={ room } />
                        <StartControl room={ room } />
                    </div>
                </section>
            </div>
        </Fragment>
    );
}
