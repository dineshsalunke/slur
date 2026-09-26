import { SEG_LEN } from '@slur/shared';
import type { PlotPoint } from '../board-scale';

export function steps( intensity: Float32Array, cruise: number ): PlotPoint[] {
    const out: PlotPoint[] = [];
    const segT = SEG_LEN / cruise;
    for ( let i = 0; i < intensity.length; i++ ) {
        out.push( [ i * segT, -intensity[ i ] ], [ ( i + 1 ) * segT, -intensity[ i ] ] );
    }
    return out;
}
