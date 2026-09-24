import { SEG_LEN } from '@slur/shared';
import { lineChunks, type PlotPoint } from './board-scale';
import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';

function steps( intensity: Float32Array, cruise: number ): PlotPoint[] {
    const out: PlotPoint[] = [];
    const segT = SEG_LEN / cruise;
    for ( let i = 0; i < intensity.length; i++ ) {
        out.push( [ i * segT, -intensity[ i ] ], [ ( i + 1 ) * segT, -intensity[ i ] ] );
    }
    return out;
}

export function IntensityPlot() {
    const { intent, cruise, duration } = usePacingReport();
    if ( ! intent ) return null;
    const segT = SEG_LEN / cruise;
    return (
        <MetricPanel
            label="Intended intensity"
            unit="0 – 1, per segment"
            heightClass="h-20"
            duration={ duration }
            yMin={ 0 }
            yMax={ 1.05 }
        >
            { intent.sections.map( ( s, n ) => (
                <rect
                    key={ s.name }
                    x={ s.i0 * segT }
                    y={ -1.05 }
                    width={ ( s.i1 - s.i0 + 1 ) * segT }
                    height={ 1.05 }
                    className={ n % 2 === 0 ? 'fill-fg/[0.04]' : 'fill-transparent' }
                />
            ) ) }
            <PolylineChunks
                chunks={ lineChunks( steps( intent.intensity, cruise ) ) }
                className="fill-none stroke-marigold stroke-[1.5px]"
            />
        </MetricPanel>
    );
}
