import type { SongAnalysis } from '../../../tapper/beat-analysis';

export interface GridPos {
    beat: number;
    bar: number;
    beatInBar: number;
}

export type Grid = Pick< SongAnalysis, 'bpm' | 'beats' | 'bars' | 'beatsPerBar' >;

function barPhase( g: Grid ): number {
    const i = g.beats.indexOf( g.bars[ 0 ] );
    return i < 0 ? 0 : i;
}

export function beatAt( g: Grid, t: number ): number {
    const b = g.beats;
    const period = 60 / g.bpm;
    if ( t < b[ 0 ] ) return ( t - b[ 0 ] ) / period;
    if ( t >= b[ b.length - 1 ] ) return b.length - 1 + ( t - b[ b.length - 1 ] ) / period;
    let lo = 0;
    let hi = b.length - 1;
    while ( hi - lo > 1 ) {
        const mid = ( lo + hi ) >> 1;
        if ( b[ mid ] <= t ) lo = mid;
        else hi = mid;
    }
    return lo + ( t - b[ lo ] ) / ( b[ hi ] - b[ lo ] );
}

export function gridAt( g: Grid, t: number ): GridPos {
    const beat = beatAt( g, t );
    const fromBar0 = beat - barPhase( g );
    const bar = Math.floor( fromBar0 / g.beatsPerBar );
    return { beat, bar, beatInBar: fromBar0 - bar * g.beatsPerBar };
}

export function barTime( g: Grid, bar: number ): number {
    if ( bar >= 0 && bar < g.bars.length ) return g.bars[ bar ];
    const barLen = ( g.beatsPerBar * 60 ) / g.bpm;
    return bar < 0 ? g.bars[ 0 ] + bar * barLen : g.bars[ g.bars.length - 1 ] + ( bar - g.bars.length + 1 ) * barLen;
}

export function isDownbeat( g: Grid, beatIndex: number ): boolean {
    return ( beatIndex - barPhase( g ) ) % g.beatsPerBar === 0;
}
