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
            { /* The timer's cyan lives on the CONTENT, not on the panel. HudPanel's base sets `text-hud`, and a
                 `text-cyan` passed through className is a competing utility of equal specificity — CSS SOURCE
                 order decides that fight, not class order, and the base won: the readout rendered white with a
                 cyan glow. Colouring a child always beats the panel's inherited colour. Every other caller
                 already does it this way. */ }
            <HudPanel className="fixed top-4 left-1/2 -translate-x-1/2 px-3.5 py-3">
                <span className="font-mono text-[26px] font-bold leading-none tracking-[2px] text-cyan text-shadow-timer">
                    { view.elapsed.toFixed( 1 ) }s
                </span>
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
