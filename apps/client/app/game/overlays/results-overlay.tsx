import type { Room } from '@colyseus/sdk';
import { computeStandings, RESTART_MESSAGE, type RunState } from '@slur/shared';
import { colorHex } from '../colors';
import type { RunView } from '../net/use-run-view';
import { LeaveButton } from './leave-button';

// Final standings (shared computeStandings → rank, DNF flag) + host-only Play Again (RESTART_MESSAGE → server
// re-opens the lobby, promoting spectators to racers) + Leave. Non-host players just see the table and wait.
export function ResultsOverlay( { room, view }: { room: Room< RunState >; view: RunView } ) {
    const isHost = view.selfId === view.hostId;
    const standings = computeStandings( view.players.map( ( p ) => ( { ...p } ) ) );
    return (
        <div className="slur-panel slur-results">
            <h2 className="slur-h">Results</h2>
            <table className="slur-table">
                <tbody>
                    { standings.map( ( s ) => (
                        <tr key={ s.id } className={ s.id === view.selfId ? 'slur-me' : '' }>
                            <td className="slur-rank">{ s.rank }</td>
                            <td>
                                <span className="slur-dot" style={ { background: colorHex( s.colorId ) } } />
                            </td>
                            <td className="slur-name">{ s.name || 'Racer' }</td>
                            <td className="slur-time">{ s.dnf ? 'DNF' : `${ s.finishTime.toFixed( 2 ) }s` }</td>
                        </tr>
                    ) ) }
                </tbody>
            </table>
            <div className="slur-actions">
                { isHost && (
                    <button type="button" className="slur-btn slur-go" onClick={ () => room.send( RESTART_MESSAGE ) }>
                        Play Again ▶
                    </button>
                ) }
                <LeaveButton />
            </div>
        </div>
    );
}
