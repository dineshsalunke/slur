import type { Room } from '@colyseus/sdk';
import { computeStandings, type RunState } from '@slur/shared';
import { useRunView } from '../net/use-run-view';
import { StandingRow } from './standing-row';

export function Standings( { room }: { room: Room< RunState > } ) {
    const view = useRunView( room );
    const standings = computeStandings( view.players );
    const leader = standings.find( ( s ) => ! s.dnf );

    return (
        <ol aria-label="Standings" className="m-0 grid min-w-0 list-none gap-1.5 p-0 tabular-nums">
            { standings.map( ( s, i ) => (
                <StandingRow
                    key={ s.id }
                    standing={ s }
                    order={ i }
                    leaderTime={ leader && leader.id !== s.id ? leader.finishTime : undefined }
                    self={ s.id === view.selfId }
                    host={ s.id === view.hostId }
                />
            ) ) }
        </ol>
    );
}
