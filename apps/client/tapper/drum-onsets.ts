import { ANALYSIS_SR, BEATS_PER_BAR, detrend, FPS, fft, HOP, ONSET_LAG_S, WIN } from './beat-analysis.ts';

export type DrumBand = 'kick' | 'snare' | 'hats';

export interface DrumOnset {
    t: number;
    strength: number;
    beat: number;
    bar: number;
    inBar: number;
}

export type DrumStreams = Record< DrumBand, DrumOnset[] >;

type Bands = Record< DrumBand, Float32Array >;
type Levels = Record< DrumBand, number >;

export interface BandFlux {
    log: Bands;
    lin: Bands;
}

export const DRUM_BANDS: Record< DrumBand, readonly [ number, number ] > = {
    kick: [ 40, 130 ],
    snare: [ 180, 4000 ],
    hats: [ 7000, 11000 ],
};

export const DRUM_TUNING = {
    detrendS: 0.25,
    threshold: 1.2,
    peakHalfFrames: 3,
    minGapS: 0.06,
    classifyFrames: 3,
    levelQuantile: 0.99,
    kickOverSnare: 0.5,
    snareOverHats: 0.7,
    snareOverKick: 0.75,
    hatsOverSnare: 1.4,
    strengthQuantile: 0.95,
};

const DRUM_KEYS: readonly DrumBand[] = [ 'kick', 'snare', 'hats' ];

function binRange( [ lo, hi ]: readonly [ number, number ] ): [ number, number ] {
    const hz = ANALYSIS_SR / WIN;
    return [ Math.max( 1, Math.round( lo / hz ) ), Math.min( WIN / 2 - 1, Math.round( hi / hz ) ) ];
}

function bands( frames: number ): Bands {
    return { kick: new Float32Array( frames ), snare: new Float32Array( frames ), hats: new Float32Array( frames ) };
}

export function bandFlux( pcm: Float32Array ): BandFlux {
    const frames = Math.max( 0, Math.floor( ( pcm.length - WIN ) / HOP ) + 1 );
    const bins = WIN / 2;
    const ranges = DRUM_KEYS.map( ( k ) => [ k, ...binRange( DRUM_BANDS[ k ] ) ] as const );
    const out = { log: bands( frames ), lin: bands( frames ) };
    const hann = Float64Array.from( { length: WIN }, ( _, i ) => 0.5 - 0.5 * Math.cos( ( 2 * Math.PI * i ) / WIN ) );
    let prev = new Float64Array( bins );
    let cur = new Float64Array( bins );
    const re = new Float64Array( WIN );
    const im = new Float64Array( WIN );
    for ( let f = 0; f < frames; f++ ) {
        for ( let i = 0; i < WIN; i++ ) {
            re[ i ] = pcm[ f * HOP + i ] * hann[ i ];
            im[ i ] = 0;
        }
        fft( re, im );
        for ( let k = 1; k < bins; k++ ) cur[ k ] = Math.hypot( re[ k ], im[ k ] );
        for ( const [ band, a, b ] of ranges ) {
            let log = 0;
            let lin = 0;
            for ( let k = a; k <= b; k++ ) {
                log += Math.max( 0, Math.log1p( 100 * cur[ k ] ) - Math.log1p( 100 * prev[ k ] ) );
                lin += Math.max( 0, cur[ k ] - prev[ k ] );
            }
            out.log[ band ][ f ] = log / ( b - a + 1 );
            out.lin[ band ][ f ] = lin;
        }
        [ prev, cur ] = [ cur, prev ];
    }
    return out;
}

function isPeak( nov: Float32Array, f: number ): boolean {
    const h = DRUM_TUNING.peakHalfFrames;
    for ( let j = Math.max( 0, f - h ); j <= Math.min( nov.length - 1, f + h ); j++ ) {
        if ( nov[ j ] > nov[ f ] || ( nov[ j ] === nov[ f ] && j < f ) ) return false;
    }
    return true;
}

export function pickPeaks( nov: Float32Array ): number[] {
    const gap = Math.round( FPS * DRUM_TUNING.minGapS );
    const peaks: number[] = [];
    for ( let f = 0; f < nov.length; f++ ) {
        if ( nov[ f ] < DRUM_TUNING.threshold || ! isPeak( nov, f ) ) continue;
        const last = peaks.at( -1 );
        if ( last !== undefined && f - last < gap ) continue;
        peaks.push( f );
    }
    return peaks;
}

function quantile( values: ArrayLike< number >, p: number ): number {
    if ( values.length === 0 ) return 1;
    const sorted = Float64Array.from( values ).sort();
    return sorted[ Math.min( sorted.length - 1, Math.floor( p * sorted.length ) ) ] || 1;
}

function around( arr: Float32Array, f: number ): number {
    let m = 0;
    for ( let j = f; j < Math.min( arr.length, f + DRUM_TUNING.classifyFrames ); j++ ) m = Math.max( m, arr[ j ] );
    return m;
}

export function bandLevels( lin: Bands ): Levels {
    const q = DRUM_TUNING.levelQuantile;
    return { kick: quantile( lin.kick, q ), snare: quantile( lin.snare, q ), hats: quantile( lin.hats, q ) };
}

export function keepsOnset( band: DrumBand, lin: Bands, levels: Levels, f: number ): boolean {
    const k = around( lin.kick, f ) / levels.kick;
    const s = around( lin.snare, f ) / levels.snare;
    const h = around( lin.hats, f ) / levels.hats;
    if ( band === 'kick' ) return k >= DRUM_TUNING.kickOverSnare * s;
    if ( band === 'snare' ) return s >= DRUM_TUNING.snareOverHats * h && s >= DRUM_TUNING.snareOverKick * k;
    return h >= DRUM_TUNING.hatsOverSnare * s;
}

export function beatPosition( beats: readonly number[], bpm: number, t: number ): number {
    const n = beats.length;
    const period = 60 / bpm;
    if ( n === 0 ) return t / period;
    if ( t <= beats[ 0 ] ) return ( t - beats[ 0 ] ) / period;
    if ( t >= beats[ n - 1 ] ) return n - 1 + ( t - beats[ n - 1 ] ) / period;
    let lo = 0;
    let hi = n - 1;
    while ( hi - lo > 1 ) {
        const mid = ( lo + hi ) >> 1;
        if ( beats[ mid ] <= t ) lo = mid;
        else hi = mid;
    }
    return lo + ( t - beats[ lo ] ) / ( beats[ hi ] - beats[ lo ] );
}

function round3( x: number ): number {
    return Math.round( x * 1000 ) / 1000;
}

function place(
    t: number,
    beats: readonly number[],
    bpm: number,
    firstBarBeat: number,
): Omit< DrumOnset, 'strength' > {
    const beat = round3( beatPosition( beats, bpm, t ) );
    const rel = beat - firstBarBeat;
    const bar = Math.floor( rel / BEATS_PER_BAR );
    return { t: round3( t ), beat, bar: Math.max( -1, bar ), inBar: round3( rel - bar * BEATS_PER_BAR ) };
}

export function drumOnsets(
    pcm: Float32Array,
    beats: readonly number[],
    bpm: number,
    firstBarBeat: number,
): DrumStreams {
    const flux = bandFlux( pcm );
    const levels = bandLevels( flux.lin );
    const stream = ( band: DrumBand ): DrumOnset[] => {
        const nov = detrend( flux.log[ band ], DRUM_TUNING.detrendS );
        const frames = pickPeaks( nov ).filter( ( f ) => keepsOnset( band, flux.lin, levels, f ) );
        const scale = quantile(
            frames.map( ( f ) => nov[ f ] ),
            DRUM_TUNING.strengthQuantile,
        );
        return frames.map( ( f ) => ( {
            ...place( f / FPS + ONSET_LAG_S, beats, bpm, firstBarBeat ),
            strength: round3( Math.min( 1, nov[ f ] / scale ) ),
        } ) );
    };
    return { kick: stream( 'kick' ), snare: stream( 'snare' ), hats: stream( 'hats' ) };
}
