import { DEFAULT_TUNING, type PacingReport, TRACK_CONTRACT } from '@slur/shared';
import { Fragment } from 'react';
import { linePoints } from './board-scale';
import { GuideLine } from './guide-line';
import { MetricPanel } from './metric-panel';

export function StrafePlot( { report }: { report: PacingReport } ) {
    const { cruise, duration, demand } = report;
    const top = DEFAULT_TUNING.strafeClamp * 1.1;
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
            <polyline
                points={ `0,0 ${ linePoints( demand.strafe, cruise, 2 ) } ${ duration },0` }
                className="fill-cyan/15 stroke-none"
            />
            <polyline
                points={ linePoints( demand.strafe, cruise, 2 ) }
                vectorEffect="non-scaling-stroke"
                className="fill-none stroke-cyan stroke-1"
            />
            <GuideLine value={ TRACK_CONTRACT.weaveStrafeClamp } duration={ duration } dashed />
            <GuideLine value={ DEFAULT_TUNING.strafeClamp } duration={ duration } />
        </MetricPanel>
    );
}
