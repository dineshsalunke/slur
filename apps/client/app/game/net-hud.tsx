import { FeatureOverlays } from '../engine/feature-overlays/feature-overlays';
import { useRoom } from '../net/room-context/use-room';
import { HudLayer } from './hud/hud-layer';
import { IdleWarning } from './hud/idle-warning/idle-warning';
import { NetFlightReadout } from './hud/net-flight-readout';
import { NetPowerRack } from './hud/net-power-rack';
import { NetRoster } from './hud/net-roster';
import { RaceDeadline } from './hud/race-deadline/race-deadline';
import { ThreatHud } from './hud/threat-hud/threat-hud';
import { TouchPad } from './hud/touch-pad/touch-pad';
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
                <RaceDeadline room={ room } />
                <IdleWarning room={ room } />
                <FeatureOverlays room={ room } />
                <ThreatHud room={ room } />
            </HudLayer>
            <TouchPad />
        </PhaseGate>
    );
}
