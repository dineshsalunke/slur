import { lineChunks } from './board-scale';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';
import { armStrafe, offsetPoints, pickedArm } from './route-lines';
import { usePickedArm } from './route-selection';

export function SelectedArmStrafe() {
    const report = usePacingReport();
    const pick = usePickedArm();
    const arm = pick ? pickedArm( report, pick.fork, pick.arm ) : null;
    if ( ! arm ) return null;
    return (
        <PolylineChunks
            chunks={ lineChunks( offsetPoints( armStrafe( arm, report.cruise ), arm.k0, report.cruise ) ) }
            className="fill-none stroke-marigold stroke-2"
        />
    );
}
