import { ColorDot } from '../../ui/color-dot';
import { Tag } from '../../ui/tag';
import { colorHex } from '../colors';
import type { PlayerView } from '../net/use-run-view';

// Player list: colour dot, name, host ★, YOU / SPECTATING tags, ship, ghosted if disconnected. A pure view
// over the run snapshot (no subscription of its own — the parent passes players/hostId/selfId as props).
export function Roster( { players, hostId, selfId }: { players: PlayerView[]; hostId: string; selfId: string } ) {
    return (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
            { players.map( ( p ) => (
                <li
                    key={ p.id }
                    className={ `flex items-center gap-2 text-[13px] ${ p.connected ? '' : 'opacity-40' }` }
                >
                    <ColorDot hex={ colorHex( p.colorId ) } />
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        { p.name || 'Racer' }
                    </span>
                    { p.id === hostId && <Tag variant="host">★</Tag> }
                    { p.id === selfId && <Tag>YOU</Tag> }
                    { p.spectating && <Tag variant="spec">SPECTATING</Tag> }
                    <span className="text-[10px] uppercase tracking-[1px] opacity-60">{ p.shipId }</span>
                </li>
            ) ) }
            { players.length === 0 && (
                <li className="flex items-center gap-2 text-[13px] opacity-40">
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        Waiting for racers…
                    </span>
                </li>
            ) }
        </ul>
    );
}
