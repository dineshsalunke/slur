import type { RunRoomLike } from '../../net/run-room-like';
import { useHostId, useRunStandings } from '../net/run-view-store';
import { StandingRow } from './standing-row/standing-row';

export function Standings( { room }: { room: RunRoomLike } ) {
    const hostId = useHostId( room );
    const standings = useRunStandings( room );
    const leader = standings.find( ( s ) => ! s.dnf );

    return (
        <ol aria-label="Standings" className="m-0 grid min-w-0 list-none gap-1.5 p-0 tabular-nums">
            { standings.map( ( s, i ) => (
                <StandingRow
                    key={ s.id }
                    standing={ s }
                    order={ i }
                    leaderTime={ leader && leader.id !== s.id ? leader.finishTime : undefined }
                    self={ s.id === room.sessionId }
                    host={ s.id === hostId }
                />
            ) ) }
        </ol>
    );
}
