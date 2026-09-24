import { HALF_WIDTH, MIN_LANE } from '@slur/shared';
import { Fragment } from 'react';
import { areaChunks, GDD_MIN_CLEAR, lineChunks, samplePoints } from './board-scale';
import { GuideLine } from './guide-line';
import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';

export function ClearancePlot() {
    const { cruise, duration, grid } = usePacingReport();
    const max = 2 * HALF_WIDTH;
    const points = samplePoints( grid.widest, cruise, 2 );
    return (
        <MetricPanel
            label="Threadable clearance"
            unit="widest open run, u"
            legend={
                <Fragment>
                    <span>solid = MIN_LANE { MIN_LANE }u</span>
                    <span>dashed = GDD MIN_CLEAR { GDD_MIN_CLEAR }u</span>
                </Fragment>
            }
            heightClass="h-20"
            duration={ duration }
            yMin={ 0 }
            yMax={ max }
        >
            <PolylineChunks chunks={ areaChunks( points ) } stroke={ false } className="fill-cyan/15 stroke-none" />
            <PolylineChunks chunks={ lineChunks( points ) } className="fill-none stroke-cyan stroke-1" />
            <GuideLine value={ MIN_LANE } duration={ duration } />
            <GuideLine value={ GDD_MIN_CLEAR } duration={ duration } dashed />
        </MetricPanel>
    );
}
