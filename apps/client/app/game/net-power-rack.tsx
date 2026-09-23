import { PHASE } from '@slur/shared';
import { useRoom } from '../net/room-context';
import { HudLayer } from './hud/hud-layer';
import { PowerRack } from './hud/power-rack';
import { useRunPhase } from './net/use-run-view';

export function NetPowerRack() {
    const room = useRoom();
    const phase = useRunPhase( room );
    if ( phase !== PHASE.racing ) return null;
    return (
        <HudLayer>
            <PowerRack />
        </HudLayer>
    );
}
