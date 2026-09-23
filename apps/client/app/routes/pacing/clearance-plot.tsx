import { HALF_WIDTH, MIN_LANE, type PacingReport } from '@slur/shared';
import { Fragment } from 'react';
import { GDD_MIN_CLEAR, linePoints } from './board-scale';
import { GuideLine } from './guide-line';
import { MetricPanel } from './metric-panel';

export function ClearancePlot( { report }: { report: PacingReport } ) {
    const { cruise, duration, grid } = report;
    const max = 2 * HALF_WIDTH;
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
            <polyline
                points={ `0,0 ${ linePoints( grid.widest, cruise, 2 ) } ${ duration },0` }
                className="fill-cyan/15 stroke-none"
            />
            <polyline
                points={ linePoints( grid.widest, cruise, 2 ) }
                vectorEffect="non-scaling-stroke"
                className="fill-none stroke-cyan stroke-1"
            />
            <GuideLine value={ MIN_LANE } duration={ duration } />
            <GuideLine value={ GDD_MIN_CLEAR } duration={ duration } dashed />
        </MetricPanel>
    );
}
