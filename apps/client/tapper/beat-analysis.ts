import { type DrumStreams, drumOnsets } from './drum-onsets.ts';

export const ANALYSIS_SR = 22050;
export const HOP = 256;
export const WIN = 1024;
export const FPS = ANALYSIS_SR / HOP;
const BPM_MIN = 70;
const BPM_MAX = 180;
const BPM_PRIOR_CENTRE = 120;
const BPM_PRIOR_OCTAVES = 0.9;
export const BEATS_PER_BAR = 4;
const TIGHTNESS = 100;
export const ONSET_LAG_S = 0.036;
const DETREND_S = 0.5;
const SECTION_GRAIN_BARS = 4;

export type EnergyTier = 'low' | 'mid' | 'high';

export interface Section {
    fromBar: number;
    toBar: number;
    label: EnergyTier;
    energy: number;
}

export interface SongAnalysis {
    song: string;
    duration: number;
    bpm: number;
    beatsPerBar: number;
    beats: number[];
    bars: number[];
    energy: number[];
    sections: Section[];
    firstBarBeat: number;
    drums: DrumStreams;
}

export function fft( re: Float64Array, im: Float64Array ): void {
    const n = re.length;
    for ( let i = 1, j = 0; i < n; i++ ) {
        let bit = n >> 1;
        for ( ; j & bit; bit >>= 1 ) j ^= bit;
        j ^= bit;
        if ( i < j ) {
            [ re[ i ], re[ j ] ] = [ re[ j ], re[ i ] ];
            [ im[ i ], im[ j ] ] = [ im[ j ], im[ i ] ];
        }
    }
    for ( let len = 2; len <= n; len <<= 1 ) butterflies( re, im, len );
}

function butterflies( re: Float64Array, im: Float64Array, len: number ): void {
    const ang = ( -2 * Math.PI ) / len;
    const wr = Math.cos( ang );
    const wi = Math.sin( ang );
    const half = len / 2;
    for ( let i = 0; i < re.length; i += len ) {
        let cr = 1;
        let ci = 0;
        for ( let k = 0; k < half; k++ ) {
            const a = i + k;
            const b = a + half;
            const tr = re[ b ] * cr - im[ b ] * ci;
            const ti = re[ b ] * ci + im[ b ] * cr;
            re[ b ] = re[ a ] - tr;
            im[ b ] = im[ a ] - ti;
            re[ a ] += tr;
            im[ a ] += ti;
            const nr = cr * wr - ci * wi;
            ci = cr * wi + ci * wr;
            cr = nr;
        }
    }
}

export function detrend( raw: Float32Array, seconds = DETREND_S ): Float32Array {
    const w = Math.round( FPS * seconds );
    const n = raw.length;
    const prefix = new Float64Array( n + 1 );
    for ( let i = 0; i < n; i++ ) prefix[ i + 1 ] = prefix[ i ] + raw[ i ];
    const out = new Float32Array( n );
    let sq = 0;
    for ( let f = 0; f < n; f++ ) {
        const a = Math.max( 0, f - w );
        const b = Math.min( n, f + w + 1 );
        out[ f ] = Math.max( 0, raw[ f ] - ( prefix[ b ] - prefix[ a ] ) / ( b - a ) );
        sq += out[ f ] * out[ f ];
    }
    const sd = Math.sqrt( sq / Math.max( 1, n ) ) || 1;
    for ( let f = 0; f < n; f++ ) out[ f ] /= sd;
    return out;
}

export function onsetEnvelope( pcm: Float32Array ): { env: Float32Array; rms: Float32Array } {
    const frames = Math.max( 0, Math.floor( ( pcm.length - WIN ) / HOP ) + 1 );
    const bins = WIN / 2;
    const hann = Float64Array.from( { length: WIN }, ( _, i ) => 0.5 - 0.5 * Math.cos( ( 2 * Math.PI * i ) / WIN ) );
    const raw = new Float32Array( frames );
    const rms = new Float32Array( frames );
    let prev = new Float32Array( bins );
    let cur = new Float32Array( bins );
    const re = new Float64Array( WIN );
    const im = new Float64Array( WIN );
    for ( let f = 0; f < frames; f++ ) {
        let sq = 0;
        for ( let i = 0; i < WIN; i++ ) {
            const s = pcm[ f * HOP + i ];
            sq += s * s;
            re[ i ] = s * hann[ i ];
            im[ i ] = 0;
        }
        rms[ f ] = Math.sqrt( sq / WIN );
        fft( re, im );
        let flux = 0;
        for ( let k = 1; k < bins; k++ ) {
            cur[ k ] = Math.log1p( 100 * Math.hypot( re[ k ], im[ k ] ) );
            flux += Math.max( 0, cur[ k ] - prev[ k ] );
        }
        raw[ f ] = flux;
        [ prev, cur ] = [ cur, prev ];
    }
    return { env: detrend( raw ), rms };
}

function autocorrelation( env: Float32Array, lagMin: number, lagMax: number ): Float64Array {
    const ac = new Float64Array( lagMax + 2 );
    for ( let lag = lagMin - 1; lag <= lagMax + 1; lag++ ) {
        let s = 0;
        for ( let i = lag; i < env.length; i++ ) s += env[ i ] * env[ i - lag ];
        ac[ lag ] = s / ( env.length - lag );
    }
    return ac;
}

export function estimateTempo( env: Float32Array ): number {
    const lagMin = Math.floor( ( 60 * FPS ) / BPM_MAX );
    const lagMax = Math.ceil( ( 60 * FPS ) / BPM_MIN );
    const ac = autocorrelation( env, lagMin, lagMax );
    let best = lagMin;
    let bestScore = -Infinity;
    for ( let lag = lagMin; lag <= lagMax; lag++ ) {
        const octaves = Math.log2( ( 60 * FPS ) / lag / BPM_PRIOR_CENTRE ) / BPM_PRIOR_OCTAVES;
        const score = ac[ lag ] * Math.exp( -0.5 * octaves * octaves );
        if ( score > bestScore ) {
            bestScore = score;
            best = lag;
        }
    }
    const curve = ac[ best - 1 ] - 2 * ac[ best ] + ac[ best + 1 ];
    const lag = curve === 0 ? best : best + ( 0.5 * ( ac[ best - 1 ] - ac[ best + 1 ] ) ) / curve;
    return ( 60 * FPS ) / lag;
}

function bestPredecessor( score: Float64Array, i: number, period: number ): number {
    const lo = Math.round( period / 2 );
    const hi = Math.round( period * 2 );
    let best = 0;
    let arg = -1;
    for ( let j = Math.max( 0, i - hi ); j <= i - lo; j++ ) {
        const v = score[ j ] - TIGHTNESS * Math.log( ( i - j ) / period ) ** 2;
        if ( arg < 0 || v > best ) {
            best = v;
            arg = j;
        }
    }
    return arg >= 0 && best > 0 ? arg : -1;
}

export function trackBeats( env: Float32Array, bpm: number ): number[] {
    const period = ( 60 * FPS ) / bpm;
    const n = env.length;
    const score = new Float64Array( n );
    const back = new Int32Array( n ).fill( -1 );
    for ( let i = 0; i < n; i++ ) {
        const j = bestPredecessor( score, i, period );
        back[ i ] = j;
        score[ i ] = env[ i ] + ( j >= 0 ? score[ j ] - TIGHTNESS * Math.log( ( i - j ) / period ) ** 2 : 0 );
    }
    let end = n - 1;
    for ( let i = n - 1; i >= Math.max( 0, n - Math.ceil( period ) ); i-- ) if ( score[ i ] > score[ end ] ) end = i;
    const frames: number[] = [];
    for ( let i = end; i >= 0; i = back[ i ] ) frames.push( i );
    return frames.reverse().map( ( f ) => f / FPS + ONSET_LAG_S );
}

export function fitBpm( beats: readonly number[] ): number {
    const n = beats.length;
    const mi = ( n - 1 ) / 2;
    const mt = beats.reduce( ( s, t ) => s + t, 0 ) / n;
    let num = 0;
    let den = 0;
    beats.forEach( ( t, i ) => {
        num += ( i - mi ) * ( t - mt );
        den += ( i - mi ) ** 2;
    } );
    return 60 / ( num / den );
}

export function barPhase( env: Float32Array, beats: readonly number[] ): number {
    const sums = new Float64Array( BEATS_PER_BAR );
    beats.forEach( ( t, i ) => {
        sums[ i % BEATS_PER_BAR ] += env[ Math.min( env.length - 1, Math.round( ( t - ONSET_LAG_S ) * FPS ) ) ];
    } );
    let best = 0;
    for ( let p = 1; p < BEATS_PER_BAR; p++ ) if ( sums[ p ] > sums[ best ] ) best = p;
    return best;
}

function mean( arr: ArrayLike< number >, a: number, b: number ): number {
    let s = 0;
    for ( let i = a; i < b; i++ ) s += arr[ i ];
    return b > a ? s / ( b - a ) : 0;
}

export function sections( energy: readonly number[] ): Section[] {
    const sorted = [ ...energy ].sort( ( x, y ) => x - y );
    const q = ( p: number ) => sorted[ Math.min( sorted.length - 1, Math.floor( p * sorted.length ) ) ];
    const t1 = q( 1 / 3 );
    const t2 = q( 2 / 3 );
    const tier = ( e: number ): EnergyTier => ( e < t1 ? 'low' : e < t2 ? 'mid' : 'high' );
    const out: Section[] = [];
    for ( let i = 0; i < energy.length; i += SECTION_GRAIN_BARS ) {
        const toBar = Math.min( energy.length, i + SECTION_GRAIN_BARS );
        const label = tier( mean( energy, i, toBar ) );
        const last = out.at( -1 );
        if ( last && last.label === label ) last.toBar = toBar;
        else out.push( { fromBar: i, toBar, label, energy: 0 } );
    }
    for ( const s of out ) s.energy = round3( mean( energy, s.fromBar, s.toBar ) );
    return out;
}

function round3( x: number ): number {
    return Math.round( x * 1000 ) / 1000;
}

export function analyzePcm( song: string, pcm: Float32Array ): SongAnalysis {
    const { env, rms } = onsetEnvelope( pcm );
    const beats = trackBeats( env, estimateTempo( env ) );
    const bpm = fitBpm( beats );
    const phase = barPhase( env, beats );
    const bars: number[] = [];
    for ( let i = phase; i < beats.length; i += BEATS_PER_BAR ) bars.push( beats[ i ] );
    const barLen = ( BEATS_PER_BAR * 60 ) / bpm;
    const raw = bars.map( ( t, i ) =>
        mean( rms, Math.round( t * FPS ), Math.min( rms.length, Math.round( ( bars[ i + 1 ] ?? t + barLen ) * FPS ) ) ),
    );
    const peak = Math.max( ...raw ) || 1;
    const energy = raw.map( ( e ) => round3( e / peak ) );
    const published = beats.map( round3 );
    return {
        song,
        duration: round3( pcm.length / ANALYSIS_SR ),
        bpm: Math.round( bpm * 100 ) / 100,
        beatsPerBar: BEATS_PER_BAR,
        beats: published,
        bars: bars.map( round3 ),
        energy,
        sections: sections( energy ),
        firstBarBeat: phase,
        drums: drumOnsets( pcm, published, bpm, phase ),
    };
}
