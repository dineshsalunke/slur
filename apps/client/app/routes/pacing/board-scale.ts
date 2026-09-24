import { PACING_DZ } from '@slur/shared';

export const DEFAULT_PPS = 24;
export const MIN_PPS = 3;
export const MAX_PPS = 240;
export const ZOOM_STEP = 1.5;
export const GDD_MIN_CLEAR = 7;
export const TICK_EVERY_S = 10;
export const CHUNK_POINTS = 64;

export type PlotPoint = readonly [ number, number ];

export interface PointChunk {
    at: number;
    points: string;
}

export function samplePoints(
    values: ArrayLike< number >,
    cruise: number,
    stride = 1,
    from = 0,
    to = values.length,
): PlotPoint[] {
    const out: PlotPoint[] = [];
    for ( let k = from; k < to; k += stride ) out.push( [ ( ( k + 0.5 ) * PACING_DZ ) / cruise, -values[ k ] ] );
    return out;
}

function formatPoint( [ x, y ]: PlotPoint ): string {
    return `${ x.toFixed( 3 ) },${ y.toFixed( 3 ) }`;
}

function chunked( points: PlotPoint[], wrap: ( run: PlotPoint[] ) => PlotPoint[] ): PointChunk[] {
    const out: PointChunk[] = [];
    for ( let i = 0; i < Math.max( 1, points.length - 1 ); i += CHUNK_POINTS ) {
        const run = points.slice( i, i + CHUNK_POINTS + 1 );
        if ( run.length === 0 ) break;
        out.push( { at: run[ 0 ][ 0 ], points: wrap( run ).map( formatPoint ).join( ' ' ) } );
    }
    return out;
}

export function lineChunks( points: PlotPoint[] ): PointChunk[] {
    return chunked( points, ( run ) => run );
}

export function areaChunks( points: PlotPoint[] ): PointChunk[] {
    return chunked( points, ( run ) => [ [ run[ 0 ][ 0 ], 0 ], ...run, [ run[ run.length - 1 ][ 0 ], 0 ] ] );
}

export function setTimeVar( el: HTMLElement | null, name: string, seconds: number ): void {
    el?.style.setProperty( name, String( seconds ) );
}
