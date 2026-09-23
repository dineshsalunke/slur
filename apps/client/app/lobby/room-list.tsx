import { PHASE, ROOM_NAME } from '@slur/shared';
import { useNavigation } from 'react-router';
import { useLobbyRooms } from './lobby-store';

const PHASE_VIEW: Record< number, { label: string; live: boolean; action: string } > = {
    [ PHASE.lobby ]: { label: 'Lobby', live: false, action: 'Join' },
    [ PHASE.countdown ]: { label: 'Starting', live: false, action: 'Join' },
    [ PHASE.racing ]: { label: 'Racing', live: true, action: 'Spectate' },
    [ PHASE.finished ]: { label: 'Results', live: true, action: 'Spectate' },
};

export function RoomList( { form }: { form: string } ) {
    const rooms = useLobbyRooms().filter( ( r ) => r.name === ROOM_NAME );
    const busy = useNavigation().state !== 'idle';

    return (
        <section aria-labelledby="live-runs" className="flex min-w-0 flex-col gap-2.5">
            <h3
                id="live-runs"
                className="m-0 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-readout-dim text-shadow-readout"
            >
                <span className="pulse-dot h-1.5 w-1.5 bg-readout" aria-hidden="true" />
                Live runs · { rooms.length }
            </h3>

            { rooms.length === 0 ? (
                <p className="m-0 text-[15px] text-readout text-shadow-readout">
                    No runs yet. Host one and send your crew the link.
                </p>
            ) : (
                <ul className="m-0 -mx-5 flex list-none gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
                    { rooms.map( ( r ) => {
                        const host = r.metadata?.hostName || 'Someone';
                        const view = PHASE_VIEW[ r.metadata?.phase ?? PHASE.lobby ] ?? PHASE_VIEW[ PHASE.lobby ];
                        return (
                            <li key={ r.roomId } className="flex-none">
                                <button
                                    type="submit"
                                    form={ form }
                                    name="join"
                                    value={ r.roomId }
                                    disabled={ busy }
                                    aria-label={ `${ view.action } ${ host }'s run` }
                                    className="group grid min-w-52 cursor-pointer grid-cols-[1fr_auto] items-center gap-x-5 border border-readout/15 bg-deep/85 px-4 py-2.5 text-left transition-colors duration-150 enabled:hover:border-marigold focus-visible:border-marigold focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-readout disabled:cursor-wait disabled:opacity-60"
                                >
                                    <span className="truncate text-[15px] font-semibold text-readout">
                                        { host }&apos;s run
                                    </span>
                                    <span className="row-span-2 text-[12px] font-bold uppercase tracking-[0.2em] text-readout-dim transition-colors duration-150 group-enabled:group-hover:text-marigold group-focus-visible:text-marigold">
                                        { view.action }
                                    </span>
                                    <span className="text-[12px] uppercase tracking-[0.14em] text-readout-dim">
                                        { r.clients } { r.clients === 1 ? 'racer' : 'racers' } ·{ ' ' }
                                        <span className={ view.live ? 'text-readout' : '' }>{ view.label }</span>
                                    </span>
                                </button>
                            </li>
                        );
                    } ) }
                </ul>
            ) }
        </section>
    );
}
