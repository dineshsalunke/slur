import { useRearViewShown } from '../../dev/rear-view-toggle';
import { PhaseGate } from '../phase-gate/phase-gate';
import { ON_TRACK_PHASES } from '../phase-gate/phase-gate.constants';
import { RearViewPass } from './rear-view-pass/rear-view-pass';

export function RearView() {
    if ( ! useRearViewShown() ) return null;

    return (
        <PhaseGate phases={ ON_TRACK_PHASES }>
            <RearViewPass />
        </PhaseGate>
    );
}
