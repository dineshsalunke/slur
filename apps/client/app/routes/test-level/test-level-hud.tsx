import type { Track } from '@slur/shared';
import { FpsReadout } from '../../dev/fps-readout';
import { FlightReadout } from '../../game/hud/flight-readout';
import { HudLayer } from '../../game/hud/hud-layer';
import { RosterPanel } from '../../game/hud/roster-panel';
import { FIXTURE_FIELD, FIXTURE_RANK, FIXTURE_ROSTER } from './hud-fixture';
import { LocalPowerSlot } from './local-power-slot';
import { testRunSeconds } from './run-clock';

export function TestLevelHud( { track }: { track: Track } ) {
    return (
        <HudLayer>
            <RosterPanel connected={ FIXTURE_FIELD } entries={ FIXTURE_ROSTER } />
            <FlightReadout track={ track } rank={ FIXTURE_RANK } field={ FIXTURE_FIELD } clock={ testRunSeconds } />
            <LocalPowerSlot />
            <div className="absolute inset-x-0 top-0 flex justify-center">
                <FpsReadout />
            </div>
        </HudLayer>
    );
}
