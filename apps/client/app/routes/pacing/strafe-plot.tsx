import { DEFAULT_TUNING, TRACK_CONTRACT } from '@slur/shared';
import { Fragment } from 'react';
import { lineChunks, samplePoints } from './board-scale';
import { GuideLine } from './guide-line';
import { LegendSwatch } from './legend-swatch';
import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';
import { strafeBand } from './route-lines';
import { SelectedArmStrafe } from './selected-arm-strafe';

export function StrafePlot() {
    const report = usePacingReport();
    const { cruise, duration, demand, arms } = report;
    const top = DEFAULT_TUNING.strafeClamp * 1.1;
    return (
        <MetricPanel
            label="Strafe rate"
            unit="u/s along the path"
            legend={
                <Fragment>
                    <LegendSwatch swatchClass="bg-cyan/25" label="min – max over routes, per second" />
                    <LegendSwatch swatchClass="bg-cyan" label="easiest" />
                    <LegendSwatch swatchClass="bg-magenta" label="hardest" />
                    <span>dashed = contract { TRACK_CONTRACT.weaveStrafeClamp }</span>
                    <span>solid = ship clamp { DEFAULT_TUNING.strafeClamp }</span>
                </Fragment>
            }
            heightClass="h-24"
            duration={ duration }
            yMin={ 0 }
            yMax={ top }
        >
            { strafeBand( report ).map( ( s ) => (
                <polygon key={ s.key } points={ s.points } className="fill-cyan/15" />
            ) ) }
            <PolylineChunks
                chunks={ lineChunks( samplePoints( demand.strafe, cruise, 2 ) ) }
                className="fill-none stroke-cyan stroke-1"
            />
            { arms && (
                <PolylineChunks
                    chunks={ lineChunks( samplePoints( arms.hardest.demand.strafe, cruise, 2 ) ) }
                    className="fill-none stroke-magenta stroke-1"
                />
            ) }
            <SelectedArmStrafe />
            <GuideLine value={ TRACK_CONTRACT.weaveStrafeClamp } duration={ duration } dashed />
            <GuideLine value={ DEFAULT_TUNING.strafeClamp } duration={ duration } />
        </MetricPanel>
    );
}
