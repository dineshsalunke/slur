import { demandSpacingSeconds, REACTION_WINDOW_S, REST_MIN_S, SEG_LEN } from '@slur/shared';
import type { PlotPoint } from '../board-scale';
import { QUIET_MAX_S } from './quiet-plot.constants';

export function quietClass( seconds: number ): string {
    if ( seconds < REACTION_WINDOW_S ) return 'fill-threat';
    if ( seconds >= REST_MIN_S ) return 'fill-cyan/70';
    return 'fill-dim';
}

export function spacingSteps( intensity: Float32Array, cruise: number ): PlotPoint[] {
    const out: PlotPoint[] = [];
    const segT = SEG_LEN / cruise;
    for ( let i = 0; i < intensity.length; i++ ) {
        const v = -Math.min( QUIET_MAX_S, demandSpacingSeconds( intensity[ i ] ) );
        out.push( [ i * segT, v ], [ ( i + 1 ) * segT, v ] );
    }
    return out;
}
