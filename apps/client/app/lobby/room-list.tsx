import { PHASE, ROOM_NAME } from '@slur/shared';
import { useLobbyRooms } from './lobby-store';

// Human label for a run's current phase (from its listing metadata) — tells a joiner whether they'll race
// or spectate before they click.
const PHASE_LABEL: Record< number, string > = {
    [ PHASE.lobby ]: 'in lobby',
    [ PHASE.countdown ]: 'starting…',
    [ PHASE.racing ]: 'racing — join to spectate',
    [ PHASE.finished ]: 'results',
};

// The live list of open runs. Reads the module store (useLobbyRooms) — re-renders only when a room is
// created/updated/closed, never per frame. Filtered to run rooms (the LobbyRoom itself is not a run).
export function RoomList( { onJoin, busy }: { onJoin: ( roomId: string ) => void; busy: boolean } ) {
    const rooms = useLobbyRooms().filter( ( r ) => r.name === ROOM_NAME );

    if ( rooms.length === 0 ) return <p>No runs yet — host one.</p>;

    return (
        <ul>
            { rooms.map( ( r ) => {
                const host = r.metadata?.hostName || 'someone';
                const label = PHASE_LABEL[ r.metadata?.phase ?? PHASE.lobby ] ?? '';
                return (
                    <li key={ r.roomId }>
                        <span>
                            { host }&apos;s run — { r.clients }/{ r.maxClients } · { label }
                        </span>
                        <button type="button" disabled={ busy } onClick={ () => onJoin( r.roomId ) }>
                            Join
                        </button>
                    </li>
                );
            } ) }
        </ul>
    );
}
