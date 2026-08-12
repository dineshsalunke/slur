import type { Room } from '@colyseus/sdk';
import { computeStandings, RESTART_MESSAGE, type RunState } from '@slur/shared';
import { ColorDot } from '../../ui/color-dot';
import { HudButton } from '../../ui/hud-button';
import { HudPanel } from '../../ui/hud-panel';
import { colorHex } from '../colors';
import { useRunView } from '../net/use-run-view';
import { LeaveButton } from './leave-button';

// Final standings (shared computeStandings → rank, DNF flag) + host-only Play Again (RESTART_MESSAGE → server
// re-opens the lobby, promoting spectators to racers) + Leave. Non-host players just see the table and wait.
export function ResultsOverlay( { room }: { room: Room< RunState > } ) {
    const view = useRunView( room );
    const isHost = view.selfId === view.hostId;
    const standings = computeStandings( view.players.map( ( p ) => ( { ...p } ) ) );
    return (
        <HudPanel className="fixed top-1/2 left-1/2 min-w-[360px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 px-3.5 py-3">
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[3px] text-cyan">Results</h2>
            <table className="mt-2 mb-3.5 w-full border-collapse">
                <tbody>
                    { standings.map( ( s ) => (
                        <tr key={ s.id } className={ s.id === view.selfId ? 'text-cyan' : '' }>
                            <td className="min-w-[18px] border-b border-cyan/15 px-2 py-1.5 font-mono text-[14px] font-bold leading-none text-cyan">
                                { s.rank }
                            </td>
                            <td className="border-b border-cyan/15 px-2 py-1.5 text-[14px]">
                                <ColorDot hex={ colorHex( s.colorId ) } />
                            </td>
                            <td className="border-b border-cyan/15 px-2 py-1.5 text-[14px]">{ s.name || 'Racer' }</td>
                            <td className="border-b border-cyan/15 px-2 py-1.5 text-right font-mono text-[14px]">
                                { s.dnf ? 'DNF' : `${ s.finishTime.toFixed( 2 ) }s` }
                            </td>
                        </tr>
                    ) ) }
                </tbody>
            </table>
            <div className="flex justify-end gap-2.5">
                { isHost && (
                    <HudButton variant="go" onClick={ () => room.send( RESTART_MESSAGE ) }>
                        Play Again ▶
                    </HudButton>
                ) }
                <LeaveButton />
            </div>
        </HudPanel>
    );
}
