import { hash2, mulberry32 } from './rng.js';

export function smoothstep( t: number ): number {
    if ( t <= 0 ) return 0;
    if ( t >= 1 ) return 1;
    return t * t * ( 3 - 2 * t );
}

export function tri( t: number ): number {
    return 2 * Math.abs( 2 * ( t - Math.floor( t + 0.5 ) ) ) - 1;
}

function nodeValue1D( seed: number, n: number ): number {
    return mulberry32( hash2( seed, n ) )();
}
function nodeValue2D( seed: number, xi: number, yi: number ): number {
    return mulberry32( hash2( hash2( seed, xi ), yi ) )();
}

export function valueNoise1D( seed: number, x: number ): number {
    const n = Math.floor( x );
    const t = x - n;
    const a = nodeValue1D( seed, n );
    const b = nodeValue1D( seed, n + 1 );
    return a + ( b - a ) * smoothstep( t );
}

export function valueNoise2D( seed: number, x: number, y: number ): number {
    const xi = Math.floor( x );
    const yi = Math.floor( y );
    const sx = smoothstep( x - xi );
    const sy = smoothstep( y - yi );
    const c00 = nodeValue2D( seed, xi, yi );
    const c10 = nodeValue2D( seed, xi + 1, yi );
    const c01 = nodeValue2D( seed, xi, yi + 1 );
    const c11 = nodeValue2D( seed, xi + 1, yi + 1 );
    const top = c00 + ( c10 - c00 ) * sx;
    const bot = c01 + ( c11 - c01 ) * sx;
    return top + ( bot - top ) * sy;
}
