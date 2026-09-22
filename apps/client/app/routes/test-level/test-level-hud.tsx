import type { Track } from '@slur/shared';
import { FlightReadout } from '../../game/hud/flight-readout';
import { HudLayer } from '../../game/hud/hud-layer';
import { PowerSlot } from '../../game/hud/power-slot';
import { RosterPanel } from '../../game/hud/roster-panel';
import { FIXTURE_FIELD, FIXTURE_POWER, FIXTURE_POWER_HINT, FIXTURE_RANK, FIXTURE_ROSTER } from './hud-fixture';
import { testRunSeconds } from './run-clock';

export function TestLevelHud( { track }: { track: Track } ) {
    return (
        <HudLayer>
            <RosterPanel connected={ FIXTURE_FIELD } entries={ FIXTURE_ROSTER } />
            <FlightReadout track={ track } rank={ FIXTURE_RANK } field={ FIXTURE_FIELD } clock={ testRunSeconds } />
            <PowerSlot label={ FIXTURE_POWER } hint={ FIXTURE_POWER_HINT } />
        </HudLayer>
    );
}
