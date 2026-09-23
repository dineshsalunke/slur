import {
    demandSpacingSeconds,
    PACING_DZ,
    type PacingReport,
    REACTION_WINDOW_S,
    REST_MIN_S,
    SEG_LEN,
} from '@slur/shared';
import { Fragment } from 'react';
import { GuideLine } from './guide-line';
import { LegendSwatch } from './legend-swatch';
import { MetricPanel } from './metric-panel';

const QUIET_MAX_S = 6;
const BAR_GAP_S = 0.04;

function quietClass( seconds: number ): string {
    if ( seconds < REACTION_WINDOW_S ) return 'fill-threat';
    if ( seconds >= REST_MIN_S ) return 'fill-cyan/70';
    return 'fill-dim';
}

function spacingSteps( intensity: Float32Array, cruise: number ): string {
    const out: string[] = [];
    const segT = SEG_LEN / cruise;
    for ( let i = 0; i < intensity.length; i++ ) {
        const v = ( -Math.min( QUIET_MAX_S, demandSpacingSeconds( intensity[ i ] ) ) ).toFixed( 3 );
        out.push( `${ ( i * segT ).toFixed( 3 ) },${ v }`, `${ ( ( i + 1 ) * segT ).toFixed( 3 ) },${ v }` );
    }
    return out.join( ' ' );
}

export function QuietPlot( { report }: { report: PacingReport } ) {
    const { cruise, duration, demand, intent } = report;
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
                <polyline
                    points={ spacingSteps( intent.intensity, cruise ) }
                    vectorEffect="non-scaling-stroke"
                    className="fill-none stroke-marigold stroke-[1.5px]"
                />
            ) }
            <GuideLine value={ REACTION_WINDOW_S } duration={ duration } dashed />
        </MetricPanel>
    );
}
