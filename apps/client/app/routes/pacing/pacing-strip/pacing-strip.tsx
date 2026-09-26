import { HALF_WIDTH, spanZ0, spanZ1 } from '@slur/shared';
import { lineChunks, samplePoints } from '../board-scale';
import { MetricPanel } from '../metric-panel';
import { usePacingReport } from '../pacing-report-context';
import { PolylineChunks } from '../polyline-chunks';
import { SelectedArmLine } from '../selected-arm-line';
import { ViableFill } from '../viable-fill';
import { airRuns } from './pacing-strip.utils';
import { PacingStripLegend } from './pacing-strip-legend';

export function PacingStrip() {
    const { cruise, duration, segments, anchors, path, intent, arms } = usePacingReport();
    const t = ( z: number ): number => z / cruise;
    return (
        <MetricPanel
            label="Track, top-down"
            unit="lateral x, 64u"
            legend={ <PacingStripLegend /> }
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
            <ViableFill />
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
            <PolylineChunks
                chunks={ lineChunks( samplePoints( path.x, cruise, 2 ) ) }
                className="fill-none stroke-cyan stroke-[1.5px]"
            />
            <PolylineChunks
                chunks={ airRuns( path.air ).flatMap( ( [ k0, k1 ] ) =>
                    lineChunks( samplePoints( path.x, cruise, 1, k0, k1 ) ),
                ) }
                className="fill-none stroke-gold stroke-[3px]"
            />
            { arms && (
                <PolylineChunks
                    chunks={ lineChunks( samplePoints( arms.hardest.path.x, cruise, 2 ) ) }
                    className="fill-none stroke-magenta stroke-[1.5px] [stroke-dasharray:4_3]"
                />
            ) }
            <SelectedArmLine />
        </MetricPanel>
    );
}
