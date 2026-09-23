import { PACING_DZ } from '@slur/shared';

export const DEFAULT_PPS = 24;
export const MIN_PPS = 3;
export const MAX_PPS = 240;
export const ZOOM_STEP = 1.5;
export const GDD_MIN_CLEAR = 7;
export const TICK_EVERY_S = 10;

export function linePoints( values: ArrayLike< number >, cruise: number, stride = 1 ): string {
    const out: string[] = [];
    for ( let k = 0; k < values.length; k += stride ) {
        out.push( `${ ( ( ( k + 0.5 ) * PACING_DZ ) / cruise ).toFixed( 3 ) },${ ( -values[ k ] ).toFixed( 3 ) }` );
    }
    return out.join( ' ' );
}

export function setTimeVar( el: HTMLElement | null, name: string, seconds: number ): void {
    el?.style.setProperty( name, String( seconds ) );
}
