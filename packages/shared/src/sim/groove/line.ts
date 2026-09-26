import { CELL } from '../../constants.js';
import { hash2, mulberry32 } from '../rng.js';
import { HALF_WIDTH, MIN_LANE, SEG_LEN, START_SAFE } from '../space.js';
import {
    GROOVE_BEAT_Z,
    GROOVE_GRAMMAR,
    type GrooveBand,
    type GrooveGrammar,
    jumpChance,
    pickKey,
    pickWeighted,
    switchChance,
} from './grammar.js';

export const GROOVE_LINE_LIMIT = HALF_WIDTH - MIN_LANE;
export const GROOVE_LEAD_BEATS = 2;
export const GROOVE_TAIL_BEATS = 3;
export const GROOVE_ARENA_EVERY = 16;
export const GROOVE_ARENA_BEATS = 5;
export const GROOVE_MOVE_BEATS = 0.7;

const SALT_GROOVE = 0x3d9a61c5 | 0;

export type GrooveEventKind = 'strafe' | 'jump';

export interface GrooveEvent {
    beat: number;
    z: number;
    band: GrooveBand;
    kind: GrooveEventKind;
    from: number;
    to: number;
    dx: number;
    nextZ: number;
}

export interface GrooveSection {
    band: GrooveBand;
    beat0: number;
    beat1: number;
}

export interface GrooveArena {
    z0: number;
    z1: number;
}

export interface GrooveLine {
    seed: number;
    length: number;
    events: GrooveEvent[];
    sections: GrooveSection[];
    arenas: GrooveArena[];
}

export function beatZ( beat: number ): number {
    return START_SAFE * SEG_LEN + Math.round( ( beat * GROOVE_BEAT_Z ) / CELL ) * CELL;
}

function sections( rand: () => number, beats: number, g: GrooveGrammar ): GrooveSection[] {
    const out: GrooveSection[] = [];
    let band: GrooveBand = 'low';
    let beat = 0;
    while ( beat < beats ) {
        const bars = Number( pickKey( g.sectionBars[ band ], rand() ) );
        out.push( { band, beat0: beat, beat1: beat + bars * g.beatsPerBar } );
        beat += bars * g.beatsPerBar;
        band = pickKey( g.sectionNext[ band ], rand() );
    }
    return out;
}

function bandAt( secs: readonly GrooveSection[], beat: number ): GrooveBand {
    return ( secs.find( ( s ) => beat >= s.beat0 && beat < s.beat1 ) ?? secs[ secs.length - 1 ] ).band;
}

function landing( from: number, dir: number, dx: number ): number {
    const straight = from + dir * dx;
    if ( Math.abs( straight ) <= GROOVE_LINE_LIMIT ) return straight;
    const flipped = from - dir * dx;
    if ( Math.abs( flipped ) <= GROOVE_LINE_LIMIT ) return flipped;
    return Math.sign( straight ) * GROOVE_LINE_LIMIT;
}

export function composeGroove( seed: number, length: number, g: GrooveGrammar = GROOVE_GRAMMAR ): GrooveLine {
    const rand = mulberry32( hash2( ( seed ^ SALT_GROOVE ) | 0, length ) );
    const lastZ = length * SEG_LEN - GROOVE_TAIL_BEATS * GROOVE_BEAT_Z;
    const totalBeats = Math.ceil( ( length * SEG_LEN ) / GROOVE_BEAT_Z );
    const secs = sections( rand, totalBeats, g );
    const events: GrooveEvent[] = [];
    const arenas: GrooveArena[] = [];
    let x = 0;
    let dir = rand() < 0.5 ? -1 : 1;
    let beat = GROOVE_LEAD_BEATS;
    let sinceArena = 0;
    while ( beatZ( beat ) <= lastZ ) {
        if ( sinceArena >= GROOVE_ARENA_EVERY ) {
            arenas.push( { z0: beatZ( beat ), z1: beatZ( beat + GROOVE_ARENA_BEATS ) } );
            beat += GROOVE_ARENA_BEATS;
            sinceArena = 0;
            continue;
        }
        const band = bandAt( secs, beat );
        const bg = g.bands[ band ];
        const gap = 1 + pickWeighted( bg.gapBeats, rand() );
        const jump = rand() < jumpChance( band, g );
        const z = beatZ( beat );
        const next = beatZ( beat + gap );
        if ( jump ) {
            events.push( { beat, z, band, kind: 'jump', from: x, to: x, dx: 0, nextZ: next } );
        } else {
            if ( events.some( ( e ) => e.kind === 'strafe' ) && rand() < switchChance( g ) ) dir = -dir;
            const bin = pickWeighted( bg.dx, rand() );
            const dx = ( bin + rand() ) * g.dxBin;
            const to = landing( x, dir, dx );
            dir = Math.sign( to - x ) || dir;
            events.push( { beat, z, band, kind: 'strafe', from: x, to, dx: Math.abs( to - x ), nextZ: next } );
            x = to;
        }
        beat += gap;
        sinceArena += gap;
    }
    return { seed, length, events, sections: secs, arenas };
}
