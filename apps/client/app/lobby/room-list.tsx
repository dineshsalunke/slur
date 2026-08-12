import { PHASE, ROOM_NAME } from '@slur/shared';
import { Button } from '../ui/button';
import { useLobbyRooms } from './lobby-store';

// A run's current phase decides three things at once: the badge colour, its label, and whether a joiner
// races or spectates. lobby/countdown = still open (Join, cyan); racing/finished = in progress (Spectate,
// amber). One source of truth so the row can't contradict itself.
const PHASE_VIEW: Record< number, { label: string; racing: boolean; action: string } > = {
    [ PHASE.lobby ]: { label: 'Race · Lobby', racing: false, action: 'Join' },
    [ PHASE.countdown ]: { label: 'Race · Starting', racing: false, action: 'Join' },
    [ PHASE.racing ]: { label: 'Racing · Live', racing: true, action: 'Spectate' },
    [ PHASE.finished ]: { label: 'Race · Results', racing: true, action: 'Spectate' },
};

// The live list of open runs. Reads the module store (useLobbyRooms) — re-renders only when a room is
// created/updated/closed, never per frame. Filtered to run rooms (the LobbyRoom itself is not a run).
// Styled as the console's live-room panel: header count + de-rounded rows (name · racers · code + badge).
export function RoomList( { onJoin, busy }: { onJoin: ( roomId: string ) => void; busy: boolean } ) {
    const rooms = useLobbyRooms().filter( ( r ) => r.name === ROOM_NAME );

    return (
        <div className="mt-[18px] flex flex-col gap-2">
            <div className="mb-0.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-dim">
                <span>Live rooms</span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="pulse-dot h-[7px] w-[7px] rounded-full bg-spring shadow-[0_0_8px_var(--color-spring)]" />
                    { rooms.length } online
                </span>
            </div>

            { rooms.length === 0 ? (
                <p className="m-0 px-0.5 py-2.5 font-mono text-[13px] text-dim">No runs yet — host one.</p>
            ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    { rooms.map( ( r ) => {
                        const host = r.metadata?.hostName || 'someone';
                        const view = PHASE_VIEW[ r.metadata?.phase ?? PHASE.lobby ] ?? PHASE_VIEW[ PHASE.lobby ];
                        return (
                            <li
                                key={ r.roomId }
                                className="grid grid-cols-[1fr_auto_auto] items-center gap-3.5 rounded-[2px] border border-line bg-black/28 px-3.5 py-3 transition-[border-color,background] duration-[160ms] hover:border-line-2 hover:bg-black/40"
                            >
                                <div>
                                    <div className="text-[15px] text-fg">{ host }&apos;s run</div>
                                    <div className="mt-0.5 font-mono text-[11px] tracking-[0.06em] text-dim">
                                        { r.clients } racers · #{ r.roomId }
                                    </div>
                                </div>
                                <span
                                    className={ `rounded-[2px] border border-current px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.18em] ${ view.racing ? 'text-marigold' : 'text-cyan' }` }
                                >
                                    { view.label }
                                </span>
                                <Button variant="ghost" disabled={ busy } onClick={ () => onJoin( r.roomId ) }>
                                    { view.action }
                                </Button>
                            </li>
                        );
                    } ) }
                </ul>
            ) }
        </div>
    );
}
