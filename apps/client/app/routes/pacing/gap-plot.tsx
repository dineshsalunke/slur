import type { PacingReport } from '@slur/shared';
import { Fragment } from 'react';
import { LegendSwatch } from './legend-swatch';
import { MetricPanel } from './metric-panel';

const WINDOW_MAX_S = 1.6;
const MARK_S = 0.12;

export function GapPlot( { report }: { report: PacingReport } ) {
    const { cruise, duration, gaps, jump } = report;
    const t = ( z: number ): number => z / cruise;
    return (
        <MetricPanel
            label="Gap takeoff window"
            unit={ `seconds, from ${ jump.source }` }
            legend={
                <Fragment>
                    <LegendSwatch swatchClass="bg-marigold" label="single jump" />
                    <LegendSwatch swatchClass="outline outline-fg/60" label="double jump" />
                    <LegendSwatch swatchClass="bg-threat" label="forced (no floor path)" />
                    <LegendSwatch swatchClass="bg-dim" label="optional" />
                    <LegendSwatch swatchClass="bg-fg/40" label="rolled over, no jump" />
                    <LegendSwatch swatchClass="bg-cyan/50" label="lengthwise slot, strafe past" />
                </Fragment>
            }
            heightClass="h-24"
            duration={ duration }
            yMin={ 0 }
            yMax={ WINDOW_MAX_S }
        >
            { gaps.map( ( g ) => {
                const x = t( g.z0 );
                const w = t( g.z1 - g.z0 );
                const single = Math.min( WINDOW_MAX_S, g.single?.seconds ?? 0 );
                const double = Math.min( WINDOW_MAX_S, g.double?.seconds ?? 0 );
                return (
                    <g key={ g.i0 }>
                        <rect
                            x={ x }
                            y={ -double }
                            width={ w }
                            height={ double }
                            vectorEffect="non-scaling-stroke"
                            className="fill-none stroke-fg/60 stroke-1"
                        />
                        <rect x={ x } y={ -single } width={ w } height={ single } className="fill-marigold" />
                        { ( g.rolls || g.slot ) && (
                            <rect
                                x={ x }
                                y={ -MARK_S }
                                width={ w }
                                height={ MARK_S }
                                className={ g.slot ? 'fill-cyan/50' : 'fill-fg/40' }
                            />
                        ) }
                        <rect
                            x={ x }
                            y={ -WINDOW_MAX_S }
                            width={ w }
                            height={ MARK_S }
                            className={ g.forced ? 'fill-threat' : 'fill-dim' }
                        />
                    </g>
                );
            } ) }
        </MetricPanel>
    );
}
