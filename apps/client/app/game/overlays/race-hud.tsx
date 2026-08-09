import { computeStandings } from '@slur/shared';
import { Fragment } from 'react';
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
            <div className="slur-panel slur-timer">{ view.elapsed.toFixed( 1 ) }s</div>
            <div className="slur-panel slur-standings">
                <ol className="slur-order">
                    { standings.map( ( s ) => (
                        <li key={ s.id } className={ s.id === view.selfId ? 'slur-row slur-me' : 'slur-row' }>
                            <span className="slur-rank">{ s.rank }</span>
                            <span className="slur-dot" style={ { background: colorHex( s.colorId ) } } />
                            <span className="slur-name">{ s.name || 'Racer' }</span>
                            { s.finished && <span className="slur-tag slur-fin">{ s.finishTime.toFixed( 1 ) }s</span> }
                        </li>
                    ) ) }
                </ol>
            </div>
            { self?.spectating && <SpectatorBar view={ view } /> }
        </Fragment>
    );
}
