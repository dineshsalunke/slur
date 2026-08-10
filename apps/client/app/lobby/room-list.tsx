import { PHASE, ROOM_NAME } from '@slur/shared';
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
        <div className="rooms">
            <div className="rooms-head">
                <span>Live rooms</span>
                <span className="live-dot">{ rooms.length } online</span>
            </div>

            { rooms.length === 0 ? (
                <p className="empty">No runs yet — host one.</p>
            ) : (
                <ul className="rooms-list">
                    { rooms.map( ( r ) => {
                        const host = r.metadata?.hostName || 'someone';
                        const view = PHASE_VIEW[ r.metadata?.phase ?? PHASE.lobby ] ?? PHASE_VIEW[ PHASE.lobby ];
                        return (
                            <li key={ r.roomId } className="room">
                                <div>
                                    <div className="rname">{ host }&apos;s run</div>
                                    <div className="rmeta">
                                        { r.clients } racers · #{ r.roomId }
                                    </div>
                                </div>
                                <span className={ `badge ${ view.racing ? 'racing' : 'race' }` }>{ view.label }</span>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    disabled={ busy }
                                    onClick={ () => onJoin( r.roomId ) }
                                >
                                    { view.action }
                                </button>
                            </li>
                        );
                    } ) }
                </ul>
            ) }
        </div>
    );
}
