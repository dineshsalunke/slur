import { useRoom } from '../net/room-context/use-room';
import { HudLayer } from './hud/hud-layer';
import { NetFlightReadout } from './hud/net-flight-readout';
import { NetPowerRack } from './hud/net-power-rack';
import { NetRoster } from './hud/net-roster';
import { TouchPad } from './hud/touch-pad';
import { PhaseGate } from './phase-gate/phase-gate';
import { ON_TRACK_PHASES } from './phase-gate/phase-gate.constants';

export function NetHud() {
    const room = useRoom();
    return (
        <PhaseGate phases={ ON_TRACK_PHASES }>
            <HudLayer>
                <NetRoster room={ room } />
                <NetFlightReadout room={ room } />
                <NetPowerRack room={ room } />
            </HudLayer>
            <TouchPad />
        </PhaseGate>
    );
}
