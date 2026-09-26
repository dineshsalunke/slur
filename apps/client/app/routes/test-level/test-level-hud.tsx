import { FpsReadout } from '../../dev/fps-readout';
import { FlightReadout } from '../../game/hud/flight-readout';
import { HudLayer } from '../../game/hud/hud-layer';
import { PowerRack } from '../../game/hud/power-rack/power-rack';
import { RosterPanel } from '../../game/hud/roster-panel';
import { FIXTURE_FIELD, FIXTURE_ROSTER, fixtureStanding } from './hud-fixture';
import { testRunSeconds } from './run-clock';

export function TestLevelHud() {
    return (
        <HudLayer>
            <RosterPanel connected={ FIXTURE_FIELD } entries={ FIXTURE_ROSTER } />
            <FlightReadout standing={ fixtureStanding } clock={ testRunSeconds } />
            <PowerRack />
            <div className="absolute inset-x-0 bottom-0 flex justify-center">
                <FpsReadout />
            </div>
        </HudLayer>
    );
}
