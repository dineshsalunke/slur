import { computeStandings } from '@slur/shared';
import { Fragment } from 'react';
import { ColorDot } from '../../ui/color-dot';
import { HudPanel } from '../../ui/hud-panel';
import { Tag } from '../../ui/tag';
import { colorHex } from '../colors';
import type { RunView } from '../net/use-run-view';
import { SpectatorBar } from './spectator-bar';

// In-race HUD: the race clock + live standings (shared computeStandings — finishers by time, then by distance
// with a DNF flag). Renders <SpectatorBar/> only when the SELF PlayerView is spectating (a mid-race joiner).
export function RaceHud( { view }: { view: RunView } ) {
    const self = view.players.find( ( p ) => p.id === view.selfId );
    const standings = computeStandings( view.players.map( ( p ) => ( { ...p } ) ) );
    return (
        <Fragment>
            <HudPanel className="fixed top-4 left-1/2 -translate-x-1/2 px-3.5 py-3 font-mono text-[26px] font-bold leading-none tracking-[2px] text-cyan text-shadow-timer">
                { view.elapsed.toFixed( 1 ) }s
            </HudPanel>
            <HudPanel className="fixed top-4 right-4 min-w-[220px] px-3.5 py-3">
                <ol className="m-0 flex list-none flex-col gap-1 p-0">
                    { standings.map( ( s ) => (
                        <li
                            key={ s.id }
                            className={ `flex items-center gap-2 text-[13px] ${ s.id === view.selfId ? 'text-cyan' : '' }` }
                        >
                            <span className="min-w-[18px] font-mono text-[13px] font-bold leading-none text-cyan">
                                { s.rank }
                            </span>
                            <ColorDot hex={ colorHex( s.colorId ) } />
                            <span className="flex-auto overflow-hidden text-ellipsis whitespace-nowrap">
                                { s.name || 'Racer' }
                            </span>
                            { s.finished && <Tag variant="fin">{ s.finishTime.toFixed( 1 ) }s</Tag> }
                        </li>
                    ) ) }
                </ol>
            </HudPanel>
            { self?.spectating && <SpectatorBar view={ view } /> }
        </Fragment>
    );
}
