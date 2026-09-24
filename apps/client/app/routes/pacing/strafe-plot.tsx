import { DEFAULT_TUNING, TRACK_CONTRACT } from '@slur/shared';
import { Fragment } from 'react';
import { areaChunks, lineChunks, samplePoints } from './board-scale';
import { GuideLine } from './guide-line';
import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';

export function StrafePlot() {
    const { cruise, duration, demand } = usePacingReport();
    const top = DEFAULT_TUNING.strafeClamp * 1.1;
    const points = samplePoints( demand.strafe, cruise, 2 );
    return (
        <MetricPanel
            label="Strafe rate"
            unit="u/s along the path"
            legend={
                <Fragment>
                    <span>dashed = contract { TRACK_CONTRACT.weaveStrafeClamp }</span>
                    <span>solid = ship clamp { DEFAULT_TUNING.strafeClamp }</span>
                </Fragment>
            }
            heightClass="h-20"
            duration={ duration }
            yMin={ 0 }
            yMax={ top }
        >
            <PolylineChunks chunks={ areaChunks( points ) } stroke={ false } className="fill-cyan/15 stroke-none" />
            <PolylineChunks chunks={ lineChunks( points ) } className="fill-none stroke-cyan stroke-1" />
            <GuideLine value={ TRACK_CONTRACT.weaveStrafeClamp } duration={ duration } dashed />
            <GuideLine value={ DEFAULT_TUNING.strafeClamp } duration={ duration } />
        </MetricPanel>
    );
}
