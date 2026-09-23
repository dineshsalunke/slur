import { type PacingIntent, SEG_LEN } from '@slur/shared';
import { MetricPanel } from './metric-panel';

function steps( intensity: Float32Array, cruise: number ): string {
    const out: string[] = [];
    const segT = SEG_LEN / cruise;
    for ( let i = 0; i < intensity.length; i++ ) {
        const v = ( -intensity[ i ] ).toFixed( 3 );
        out.push( `${ ( i * segT ).toFixed( 3 ) },${ v }`, `${ ( ( i + 1 ) * segT ).toFixed( 3 ) },${ v }` );
    }
    return out.join( ' ' );
}

export function IntensityPlot( {
    intent,
    cruise,
    duration,
}: {
    intent: PacingIntent;
    cruise: number;
    duration: number;
} ) {
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
            <polyline
                points={ steps( intent.intensity, cruise ) }
                vectorEffect="non-scaling-stroke"
                className="fill-none stroke-marigold stroke-[1.5px]"
            />
        </MetricPanel>
    );
}
