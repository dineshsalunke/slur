import {
    CELL,
    type ComposedNote,
    type ComposedPhrase,
    type ComposedScore,
    clamp,
    intensityAt,
    type MotifNote,
    mirrorNote,
    type NoteToken,
    parseNotes,
    SCORE_LINE_LIMIT,
    SEG_LEN,
    START_SAFE,
    TRACK_CONTRACT,
} from '@slur/shared';
import type { SongAnalysis } from '../tapper/beat-analysis.ts';

export interface SongClock {
    t0: number;
    z0: number;
    zPerSecond: number;
    zPerBeat: number;
    length: number;
}

export interface SongEvent {
    t: number;
    token: NoteToken;
    accent: boolean;
}

export const CURVE_FLOOR = 0.15;
export const CURVE_CEIL = 1;

export function songClock( a: SongAnalysis ): SongClock {
    const zPerSecond = TRACK_CONTRACT.registerCruise;
    const t0 = a.bars[ 0 ] ?? a.beats[ 0 ] ?? 0;
    const z0 = START_SAFE * SEG_LEN;
    const length = Math.ceil( ( z0 + ( a.duration - t0 ) * zPerSecond ) / SEG_LEN );
    return { t0, z0, zPerSecond, zPerBeat: ( zPerSecond * 60 ) / a.bpm, length };
}

export function zAt( c: SongClock, t: number ): number {
    return c.z0 + ( t - c.t0 ) * c.zPerSecond;
}

export function tAt( c: SongClock, z: number ): number {
    return c.t0 + ( z - c.z0 ) / c.zPerSecond;
}

export function barAt( a: SongAnalysis, t: number ): number {
    let lo = 0;
    let hi = a.bars.length - 1;
    if ( hi < 0 || t < a.bars[ 0 ] ) return -1;
    while ( lo < hi ) {
        const mid = ( lo + hi + 1 ) >> 1;
        if ( a.bars[ mid ] <= t ) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}

export function sectionAt( a: SongAnalysis, bar: number ): number {
    const i = a.sections.findIndex( ( s ) => s.fromBar <= bar && bar < s.toBar );
    return i < 0 ? (bar < 0 ? 0 : a.sections.length - 1) : i;
}

export function rescale( values: readonly number[] ): number[] {
    const lo = Math.min( ...values );
    const hi = Math.max( ...values );
    const span = hi - lo;
    return values.map( ( v ) =>
        span > 0 ? CURVE_FLOOR + ( ( v - lo ) / span ) * ( CURVE_CEIL - CURVE_FLOOR ) : 0.5,
    );
}

export function smooth( values: readonly number[], radius: number ): number[] {
    return values.map( ( _, i ) => {
        let sum = 0;
        let n = 0;
        for ( let k = i - radius; k <= i + radius; k++ )
            if ( k >= 0 && k < values.length ) {
                sum += values[ k ];
                n++;
            }
        return sum / n;
    } );
}

export function barCurve( a: SongAnalysis, c: SongClock, perBar: readonly number[] ): number[] {
    return Array.from( { length: c.length }, ( _, i ) => {
        if ( i < START_SAFE ) return 0;
        const bar = barAt( a, tAt( c, i * SEG_LEN ) );
        return bar < 0 ? 0 : clamp( perBar[ Math.min( bar, perBar.length - 1 ) ], 0, 1 );
    } );
}

export function sectionBars( a: SongAnalysis ): number[] {
    return a.bars.map( ( _, bar ) => a.sections[ sectionAt( a, bar ) ].energy );
}

export function breathAtSectionStarts( a: SongAnalysis, perBar: readonly number[], bars: number ): number[] {
    const out = [ ...perBar ];
    for ( const s of a.sections ) for ( let b = s.fromBar; b < s.fromBar + bars && b < s.toBar; b++ ) out[ b ] = 0;
    return out;
}

export function defaultCurve( length: number ): number[] {
    return Array.from( { length }, ( _, i ) => intensityAt( i, length ) );
}

function fits( n: MotifNote, x: number ): boolean {
    return Math.abs( x + n.dir * n.cells * CELL ) <= SCORE_LINE_LIMIT;
}

const REST = parseNotes( '.' )[ 0 ];

export function padTo( notes: ComposedNote[], z: number, to: number, x: number, phrase: number ): number {
    let at = z;
    while ( to - at >= REST.duration ) {
        notes.push( { ...REST, z: at, x, phrase } );
        at += REST.duration;
    }
    const spare = to - at;
    if ( spare <= 0 ) return at;
    const last = notes[ notes.length - 1 ];
    if ( last !== undefined ) last.duration += spare;
    else notes.push( { ...REST, duration: spare, z: at, x, phrase } );
    return to;
}

export function placeEvents(
    a: SongAnalysis,
    c: SongClock,
    seed: number,
    events: readonly SongEvent[],
    curve: readonly number[],
): ComposedScore {
    const sorted = [ ...events ].sort( ( p, q ) => p.t - q.t );
    const end = c.length * SEG_LEN;
    const notes: ComposedNote[] = [];
    let z = c.z0;
    let x = 0;
    for ( const e of sorted ) {
        const ez = Math.ceil( zAt( c, e.t ) / SEG_LEN ) * SEG_LEN;
        if ( ez < z ) continue;
        let n: MotifNote = { ...parseNotes( e.accent ? `!${ e.token }` : e.token )[ 0 ] };
        if ( ! fits( n, x ) ) n = mirrorNote( n );
        if ( ! fits( n, x ) || ez + n.duration > end ) continue;
        const phrase = sectionAt( a, barAt( a, e.t ) );
        z = padTo( notes, z, ez, x, phrase );
        x += n.dir * n.cells * CELL;
        notes.push( { ...n, z: ez, x, phrase } );
        z = ez + n.duration;
    }
    return { seed, length: c.length, curve: [ ...curve ], phrases: phrasesOf( notes, curve ), notes };
}

export function phrasesOf( notes: readonly ComposedNote[], curve: readonly number[] ): ComposedPhrase[] {
    const out: ComposedPhrase[] = [];
    for ( const n of notes ) {
        const last = out[ out.length - 1 ];
        if ( last !== undefined && last.index === n.phrase ) last.z1 = n.z + n.duration;
        else
            out.push( {
                index: n.phrase,
                motif: null,
                variation: null,
                attempt: -1,
                intensity: curve[ Math.floor( n.z / SEG_LEN ) ] ?? 0,
                z0: n.z,
                z1: n.z + n.duration,
            } );
    }
    return out;
}
