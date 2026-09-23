import { HALF_WIDTH, PACING_DZ, type PacingReport, spanZ0, spanZ1 } from '@slur/shared';
import { Fragment } from 'react';
import { linePoints } from './board-scale';
import { LegendSwatch } from './legend-swatch';
import { MetricPanel } from './metric-panel';

function airRuns( air: Uint8Array ): Array< [ number, number ] > {
    const out: Array< [ number, number ] > = [];
    let k = 0;
    while ( k < air.length ) {
        if ( air[ k ] === 0 ) {
            k++;
            continue;
        }
        let end = k;
        while ( end < air.length && air[ end ] === 1 ) end++;
        out.push( [ Math.max( 0, k - 1 ), Math.min( air.length, end + 1 ) ] );
        k = end;
    }
    return out;
}

const LEGEND = (
    <Fragment>
        <LegendSwatch swatchClass="bg-dim" label="sealed block" />
        <LegendSwatch swatchClass="bg-marigold" label="fractured block" />
        <LegendSwatch swatchClass="bg-void outline outline-line-2" label="hole" />
        <LegendSwatch swatchClass="bg-fg/10" label="intended band" />
        <LegendSwatch swatchClass="bg-magenta/40" label="pinch" />
        <LegendSwatch swatchClass="bg-cyan" label="reference path" />
        <LegendSwatch swatchClass="bg-gold" label="airborne / pickup" />
        <span className="pt-1">top = left (+x)</span>
    </Fragment>
);

export function PacingStrip( { report }: { report: PacingReport } ) {
    const { cruise, duration, segments, anchors, path, intent } = report;
    const t = ( z: number ): number => z / cruise;
    return (
        <MetricPanel
            label="Track, top-down"
            unit="lateral x, 64u"
            legend={ LEGEND }
            heightClass="h-64"
            duration={ duration }
            yMin={ -HALF_WIDTH }
            yMax={ HALF_WIDTH }
        >
            <rect x={ 0 } y={ -HALF_WIDTH } width={ duration } height={ 2 * HALF_WIDTH } className="fill-space" />
            { segments.map( ( seg ) =>
                seg.kind !== 'gap' ? null : (
                    <g key={ `h${ seg.index }` }>
                        <rect
                            x={ t( seg.z0 ) }
                            y={ -HALF_WIDTH }
                            width={ t( seg.z1 - seg.z0 ) }
                            height={ 2 * HALF_WIDTH }
                            className="fill-void"
                        />
                        { seg.floors.map( ( f ) => (
                            <rect
                                key={ `${ f.x0 }:${ spanZ0( seg, f ) }` }
                                x={ t( spanZ0( seg, f ) ) }
                                y={ -f.x1 }
                                width={ t( spanZ1( seg, f ) - spanZ0( seg, f ) ) }
                                height={ f.x1 - f.x0 }
                                className="fill-space"
                            />
                        ) ) }
                    </g>
                ),
            ) }
            { intent?.bands.map( ( b, i ) =>
                b === null ? null : (
                    <rect
                        key={ `b${ segments[ i ].index }` }
                        x={ t( segments[ i ].z0 ) }
                        y={ -b.x1 }
                        width={ t( segments[ i ].z1 - segments[ i ].z0 ) }
                        height={ b.x1 - b.x0 }
                        className={ b.pinched ? 'fill-magenta/25' : 'fill-fg/[0.06]' }
                    />
                ),
            ) }
            { segments.flatMap( ( seg ) =>
                seg.blocks.map( ( b ) => (
                    <rect
                        key={ b.id }
                        x={ t( b.z0 ) }
                        y={ -b.x1 }
                        width={ t( b.z1 - b.z0 ) }
                        height={ b.x1 - b.x0 }
                        className={ b.kind === 'fractured' ? 'fill-marigold' : 'fill-dim' }
                    />
                ) ),
            ) }
            { anchors.map( ( a ) => (
                <line
                    key={ a.id }
                    x1={ t( a.z ) }
                    x2={ t( a.z ) }
                    y1={ -a.x - 1.5 }
                    y2={ -a.x + 1.5 }
                    vectorEffect="non-scaling-stroke"
                    className="stroke-gold stroke-[3px]"
                />
            ) ) }
            <polyline
                points={ linePoints( path.x, cruise, 2 ) }
                vectorEffect="non-scaling-stroke"
                className="fill-none stroke-cyan stroke-[1.5px]"
            />
            { airRuns( path.air ).map( ( [ k0, k1 ] ) => (
                <polyline
                    key={ k0 }
                    points={ linePoints( path.x.subarray( k0, k1 ), cruise ) }
                    transform={ `translate(${ t( k0 * PACING_DZ ) } 0)` }
                    vectorEffect="non-scaling-stroke"
                    className="fill-none stroke-gold stroke-[3px]"
                />
            ) ) }
        </MetricPanel>
    );
}
