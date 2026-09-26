import type { Room } from '@colyseus/sdk';
import { isShipId, type RunState, SHIPS } from '@slur/shared';
import { playerBg } from '../colors';
import { useHostId, useRunPlayers } from '../net/run-view-store';

const TAG = 'text-[11px] font-bold uppercase tracking-[0.2em]';

export function Roster( { room, className = '' }: { room: Room< RunState >; className?: string } ) {
    const hostId = useHostId( room );
    const players = useRunPlayers( room );

    return (
        <ul
            aria-label="Racers"
            className={ `${ className } m-0 flex list-none gap-2 overflow-x-auto p-0 [scrollbar-width:none]` }
        >
            { players.map( ( p ) => {
                const self = p.id === room.sessionId;
                return (
                    <li
                        key={ p.id }
                        className={ `flex flex-none items-center gap-2.5 border bg-deep/85 px-3 py-2 ${ self ? 'border-readout/45' : 'border-readout/15' } ${ p.connected ? '' : 'opacity-40' }` }
                    >
                        <span aria-hidden="true" className={ `size-2.5 flex-none ${ playerBg( p.colorId ) }` } />
                        <span className="max-w-[14ch] truncate text-[15px] font-semibold text-readout">
                            { p.name || 'Racer' }
                            { p.connected ? '' : ' · reconnecting' }
                        </span>
                        { self && <span className={ `${ TAG } text-readout` }>You</span> }
                        { p.id === hostId && <span className={ `${ TAG } text-readout-dim` }>Host</span> }
                        { p.spectating && <span className={ `${ TAG } text-readout-dim` }>Spectating</span> }
                        <span className="text-[12px] uppercase tracking-[0.16em] text-readout-dim">
                            { isShipId( p.shipId ) ? SHIPS[ p.shipId ].name : p.shipId }
                        </span>
                    </li>
                );
            } ) }
        </ul>
    );
}
