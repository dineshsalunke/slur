import { colorHex } from '../colors';
import type { PlayerView } from '../net/use-run-view';

// Player list: colour dot, name, host ★, YOU / SPECTATING tags, ship, ghosted if disconnected. A pure view
// over the run snapshot (no subscription of its own — the parent passes players/hostId/selfId as props).
export function Roster( { players, hostId, selfId }: { players: PlayerView[]; hostId: string; selfId: string } ) {
    return (
        <ul className="slur-roster">
            { players.map( ( p ) => (
                <li key={ p.id } className={ p.connected ? 'slur-row' : 'slur-row slur-ghost' }>
                    <span className="slur-dot" style={ { background: colorHex( p.colorId ) } } />
                    <span className="slur-name">{ p.name || 'Racer' }</span>
                    { p.id === hostId && <span className="slur-tag slur-host">★</span> }
                    { p.id === selfId && <span className="slur-tag">YOU</span> }
                    { p.spectating && <span className="slur-tag slur-spec">SPECTATING</span> }
                    <span className="slur-ship">{ p.shipId }</span>
                </li>
            ) ) }
            { players.length === 0 && (
                <li className="slur-row slur-ghost">
                    <span className="slur-name">Waiting for racers…</span>
                </li>
            ) }
        </ul>
    );
}
