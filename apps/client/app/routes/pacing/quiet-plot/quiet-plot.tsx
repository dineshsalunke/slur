import { PACING_DZ, REACTION_WINDOW_S, REST_MIN_S } from '@slur/shared';
import { Fragment } from 'react';
import { lineChunks } from '../board-scale';
import { GuideLine } from '../guide-line';
import { LegendSwatch } from '../legend-swatch';
import { MetricPanel } from '../metric-panel';
import { usePacingReport } from '../pacing-report-context';
import { PolylineChunks } from '../polyline-chunks';
import { BAR_GAP_S, QUIET_MAX_S } from './quiet-plot.constants';
import { quietClass, spacingSteps } from './quiet-plot.utils';

export function QuietPlot() {
    const { cruise, duration, demand, intent } = usePacingReport();
    const t = ( k: number ): number => ( k * PACING_DZ ) / cruise;
    return (
        <MetricPanel
            label="Quiet time between inputs"
            unit={ `seconds, capped at ${ QUIET_MAX_S }` }
            legend={
                <Fragment>
                    <LegendSwatch swatchClass="bg-threat" label={ `< ${ REACTION_WINDOW_S }s reaction window` } />
                    <LegendSwatch swatchClass="bg-cyan/70" label={ `rest ≥ ${ REST_MIN_S }s` } />
                    <LegendSwatch swatchClass="bg-marigold" label="intended spacing" />
                </Fragment>
            }
            heightClass="h-24"
            duration={ duration }
            yMin={ 0 }
            yMax={ QUIET_MAX_S }
        >
            { demand.quiet.map( ( q ) => (
                <rect
                    key={ q.k0 }
                    x={ t( q.k0 ) + BAR_GAP_S / 2 }
                    y={ -Math.min( QUIET_MAX_S, q.seconds ) }
                    width={ Math.max( 0, t( q.k1 ) - t( q.k0 ) - BAR_GAP_S ) }
                    height={ Math.min( QUIET_MAX_S, q.seconds ) }
                    className={ quietClass( q.seconds ) }
                />
            ) ) }
            { intent && (
                <PolylineChunks
                    chunks={ lineChunks( spacingSteps( intent.intensity, cruise ) ) }
                    className="fill-none stroke-marigold stroke-[1.5px]"
                />
            ) }
            <GuideLine value={ REACTION_WINDOW_S } duration={ duration } dashed />
        </MetricPanel>
    );
}
