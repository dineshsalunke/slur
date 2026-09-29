import { QualityGate } from '../../quality/quality-gate/quality-gate';
import { useRearViewShown } from '../input/rear-view-toggle';
import { PhaseGate } from '../phase-gate/phase-gate';
import { ON_TRACK_PHASES } from '../phase-gate/phase-gate.constants';
import { RearViewPass } from './rear-view-pass/rear-view-pass';

export function RearView() {
    if ( ! useRearViewShown() ) return null;

    return (
        <PhaseGate phases={ ON_TRACK_PHASES }>
            <QualityGate feature="rearView">
                <RearViewPass />
            </QualityGate>
        </PhaseGate>
    );
}
