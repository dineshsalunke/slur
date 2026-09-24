import { Fragment } from 'react';
import { lineChunks, type PlotPoint } from './board-scale';
import { LegendSwatch } from './legend-swatch';
import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';

const BAR_GAP_S = 0.12;

export function LateralBars() {
    const { duration, demand, arms } = usePacingReport();
    const hardBins = arms?.hardest.demand.bins ?? [];
    const peak = Math.max( 1, ...demand.bins.map( ( b ) => b.lateral ), ...hardBins.map( ( b ) => b.lateral ) );
    const top = Math.ceil( peak / 10 ) * 10;
    const hardSteps = hardBins.flatMap( ( b ): PlotPoint[] => [
        [ b.t0, -b.lateral ],
        [ b.t1, -b.lateral ],
    ] );
    return (
        <MetricPanel
            label="Lateral travel"
            unit={ `u per second, 0 – ${ top }` }
            legend={
                arms && (
                    <Fragment>
                        <LegendSwatch swatchClass="bg-cyan/70" label="easiest" />
                        <LegendSwatch swatchClass="bg-magenta" label="hardest" />
                    </Fragment>
                )
            }
            heightClass="h-20"
            duration={ duration }
            yMin={ 0 }
            yMax={ top }
        >
            { demand.bins.map( ( b ) => (
                <rect
                    key={ b.t0 }
                    x={ b.t0 + BAR_GAP_S / 2 }
                    y={ -b.lateral }
                    width={ Math.max( 0, b.t1 - b.t0 - BAR_GAP_S ) }
                    height={ b.lateral }
                    className="fill-cyan/70"
                />
            ) ) }
            <PolylineChunks chunks={ lineChunks( hardSteps ) } className="fill-none stroke-magenta stroke-1" />
        </MetricPanel>
    );
}
