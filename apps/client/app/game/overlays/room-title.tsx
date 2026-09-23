import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import type { ReactNode } from 'react';
import { useRunView } from '../net/use-run-view';

export function RoomTitle( { room, children }: { room: Room< RunState >; children: ReactNode } ) {
    const view = useRunView( room );
    const host = view.players.find( ( p ) => p.id === view.hostId );
    const title = view.selfId === view.hostId ? 'Your run' : `${ host?.name || 'Host' }'s run`;
    const count = view.players.length;

    return (
        <section aria-labelledby="run-title" className="flex flex-col gap-3">
            <h2
                id="run-title"
                className="m-0 max-w-[20ch] truncate text-[clamp(30px,3.6vw,46px)] font-bold uppercase leading-[0.95] tracking-[0.01em] text-shadow-readout"
            >
                { title }
            </h2>
            <div className="flex flex-wrap items-center gap-4">
                <p className="m-0 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-readout text-shadow-readout">
                    <span aria-hidden="true" className="size-1.5 bg-marigold" />
                    Lobby · { count } { count === 1 ? 'racer' : 'racers' }
                </p>
                { children }
            </div>
        </section>
    );
}
