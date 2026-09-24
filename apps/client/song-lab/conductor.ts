import {
    CELL,
    type ComposedNote,
    type MotifNote,
    moveZ,
    parseNotes,
    SCORE_GATE_Z,
    SCORE_LINE_LIMIT,
    SEG_LEN,
} from '@slur/shared';
import type { Section } from '../tapper/beat-analysis.ts';
import type { LabBuild, LabStage } from './bundle.ts';
import { barTime, beatLen, hitTimes, tapNote } from './groove.ts';
import { barCurve, gridStart, padTo, phrasesOf, rescale, type SongClock, smooth, zAt } from './map.ts';
import type { LabSongAnalysis, VariantSpec } from './variants.ts';

export const CONDUCTOR_CYCLE_BARS = 2;
export const CONDUCTOR_PHRASE_CYCLES = 2;
export const LEGATO_MAX_HITS = 2;
export const STACCATO_MIN_HITS = 7;
export const FERMATA_ENERGY = 0.2;
export const JUMP_LAND_Z = 41;
export const TAP_LAND_Z = 37;
export const PREP_RAIL_Z = 60;
export const HOME_CELLS = 2;

type Size = 'held' | 'big' | 'small';
type Feel = 'legato' | 'staccato' | 'plain' | 'echo';

const SIZES: readonly Size[] = [ 'held', 'big', 'small' ];
const LEFT: Record< Size, string > = { held: '<', big: 'L', small: 'l' };
const RIGHT: Record< Size, string > = { held: '>', big: 'R', small: 'r' };

export interface ConductorStats {
    cycles: number;
    legato: number;
    staccato: number;
    plain: number;
    echo: number;
    inEarly: number;
    inDownsized: number;
    outLate: number;
    outDropped: number;
    upLate: number;
    prepRails: number;
}

interface Conducting {
    a: LabSongAnalysis;
    c: SongClock;
    notes: ComposedNote[];
    taps: number[];
    rails: [ number, number ][];
    z: number;
    x: number;
    landed: number;
    stats: ConductorStats;
}

function snapUp( z: number ): number {
    return Math.ceil( z / SEG_LEN ) * SEG_LEN;
}

function roundSeg( z: number ): number {
    return Math.round( z / SEG_LEN ) * SEG_LEN;
}

export function downbeat( a: LabSongAnalysis, bar: number ): number {
    const last = a.bars.length - 1;
    if ( bar <= last || last < 0 ) return barTime( a, bar );
    return a.bars[ last ] + ( bar - last ) * a.beatsPerBar * beatLen( a, last );
}

function barZ( p: Conducting, bar: number, beats = 0 ): number {
    return zAt( p.c, downbeat( p.a, bar ) + beats * beatLen( p.a, bar ) );
}

function stroke( size: Size, dir: number, accent: boolean ): MotifNote {
    const token = ( dir < 0 ? LEFT : RIGHT )[ size ];
    return parseNotes( accent && size !== 'held' ? `!${ token }` : token )[ 0 ];
}

function after( n: MotifNote, x: number ): number {
    return x + n.dir * n.cells * CELL;
}

function inLine( n: MotifNote, x: number ): boolean {
    return Math.abs( after( n, x ) ) <= SCORE_LINE_LIMIT;
}

function put( p: Conducting, note: MotifNote, z: number, phrase: number ): ComposedNote {
    p.z = padTo( p.notes, p.z, z, p.x, phrase );
    p.x = after( note, p.x );
    const placed: ComposedNote = { ...note, z, x: p.x, phrase };
    p.notes.push( placed );
    p.z = z + note.duration;
    return placed;
}

function jumpZ( land: number, tap: boolean ): number {
    return roundSeg( land - ( tap ? TAP_LAND_Z : JUMP_LAND_Z ) );
}

function jumpTo( p: Conducting, bar: number, tap: boolean, phrase: number ): void {
    const want = jumpZ( barZ( p, bar ), tap );
    if ( want < p.z ) p.stats.upLate++;
    const z = Math.max( want, p.z );
    put( p, tap ? tapNote() : parseNotes( 'J' )[ 0 ], z, phrase );
    if ( tap ) p.taps.push( z );
    p.landed = bar;
}

function hitsIn( a: LabSongAnalysis, hits: readonly number[], bar: number ): number {
    const t0 = barTime( a, bar );
    const t1 = barTime( a, bar + CONDUCTOR_CYCLE_BARS );
    return hits.filter( ( t ) => t >= t0 && t < t1 ).length;
}

function placeIn( p: Conducting, size: Size, accent: boolean, want: number, out: number, phrase: number ): number {
    for ( const s of SIZES.slice( SIZES.indexOf( size ) ) ) {
        const note = stroke( s, -1, accent );
        if ( ! inLine( note, p.x ) ) continue;
        const z = Math.max( want, p.z );
        if ( z + note.duration <= out ) {
            if ( s !== size ) p.stats.inDownsized++;
            return put( p, note, z, phrase ).z + note.duration;
        }
        const early = out - note.duration;
        if ( early >= p.z ) {
            p.stats.inEarly++;
            if ( s !== size ) p.stats.inDownsized++;
            return put( p, note, early, phrase ).z + note.duration;
        }
    }
    const small = stroke( 'small', -1, accent );
    if ( ! inLine( small, p.x ) ) return out;
    p.stats.outLate++;
    if ( size !== 'small' ) p.stats.inDownsized++;
    return put( p, small, Math.max( want, p.z ), phrase ).z + small.duration;
}

function outChoice( p: Conducting, size: Size, accent: boolean, z: number, up: number ): MotifNote | null {
    const order = [ size, ...SIZES.filter( ( s ) => s !== size ) ];
    const fit = order
        .map( ( s ) => stroke( s, 1, accent ) )
        .filter( ( n ) => z + n.duration <= up && inLine( n, p.x ) );
    const home = fit.find( ( n ) => Math.abs( after( n, p.x ) ) <= HOME_CELLS * CELL );
    if ( home !== undefined ) return home;
    return fit.reduce< MotifNote | null >(
        ( best, n ) => ( best === null || Math.abs( after( n, p.x ) ) < Math.abs( after( best, p.x ) ) ? n : best ),
        null,
    );
}

function feelOf( loud: boolean, first: boolean, hits: number ): Feel {
    if ( loud && ! first ) return 'echo';
    if ( hits <= LEGATO_MAX_HITS ) return 'legato';
    if ( hits >= STACCATO_MIN_HITS ) return 'staccato';
    return 'plain';
}

function placeCycle( p: Conducting, s: Section, b: number, phrase: number, first: boolean, prep: boolean ): void {
    const loud = s.label === 'high';
    const feel = feelOf( loud, first, hitsIn( p.a, hitTimes( p.a ), b ) );
    p.stats.cycles++;
    p.stats[ feel ]++;
    const size: Size = feel === 'legato' ? 'held' : loud || first ? 'big' : 'small';
    const accent = feel === 'staccato' || ( first && loud );
    const tapUp = feel === 'staccato' || feel === 'echo';
    if ( p.landed !== b && jumpZ( barZ( p, b ), false ) >= p.z ) jumpTo( p, b, false, phrase );
    const onset = snapUp( barZ( p, b + 1 ) );
    const inEnd = placeIn( p, size, accent, snapUp( barZ( p, b, 2 ) ), onset, phrase );
    const outZ = Math.max( onset, inEnd, p.z );
    const up = jumpZ( barZ( p, b + CONDUCTOR_CYCLE_BARS ), tapUp );
    const out = feel === 'echo' ? parseNotes( 'J' )[ 0 ] : outChoice( p, size, accent, outZ, up );
    placeOut( p, out, outZ, up, prep, phrase );
    jumpTo( p, b + CONDUCTOR_CYCLE_BARS, tapUp, phrase );
}

function placeOut( p: Conducting, out: MotifNote | null, z: number, up: number, prep: boolean, phrase: number ): void {
    if ( out === null || z + out.duration > up ) {
        p.stats.outDropped++;
        return;
    }
    const placed = put( p, out, z, phrase );
    if ( ! prep || out.kind === 'jump' ) return;
    const z0 = Math.max( up - PREP_RAIL_Z, placed.z + moveZ( placed ) + SCORE_GATE_Z );
    if ( z0 >= up ) return;
    p.rails.push( [ z0, up ] );
    p.stats.prepRails++;
}

export function fermataBar( a: LabSongAnalysis ): number {
    const i = a.energy.findIndex( ( e ) => e < FERMATA_ENERGY );
    return i < 0 ? a.bars.length : i;
}

export interface PlacedConductor {
    notes: ComposedNote[];
    taps: number[];
    stage: LabStage;
    fermata: number;
    stats: ConductorStats;
}

export function placeConductor( a: LabSongAnalysis, c: SongClock ): PlacedConductor {
    const stats: ConductorStats = {
        cycles: 0,
        legato: 0,
        staccato: 0,
        plain: 0,
        echo: 0,
        inEarly: 0,
        inDownsized: 0,
        outLate: 0,
        outDropped: 0,
        upLate: 0,
        prepRails: 0,
    };
    const p: Conducting = { a, c, notes: [], taps: [], rails: [], z: gridStart( c ), x: 0, landed: -1, stats };
    const fermata = fermataBar( a );
    a.sections.forEach( ( s, phrase ) => {
        const nextHigh = a.sections[ phrase + 1 ]?.label === 'high';
        for ( let b = s.fromBar; b < s.toBar && b < fermata; b += CONDUCTOR_CYCLE_BARS ) {
            const end = b + CONDUCTOR_CYCLE_BARS;
            if ( end > fermata ) {
                if ( p.landed !== b && jumpZ( barZ( p, b ), false ) >= p.z ) jumpTo( p, b, false, phrase );
                jumpTo( p, fermata, false, phrase );
                return;
            }
            if ( end > s.toBar ) return;
            const first = ( ( b - s.fromBar ) / CONDUCTOR_CYCLE_BARS ) % CONDUCTOR_PHRASE_CYCLES === 0;
            placeCycle( p, s, b, phrase, first, nextHigh && end === s.toBar );
        }
    } );
    const open: [ number, number ][] =
        fermata < a.bars.length ? [ [ snapUp( barZ( p, fermata ) ), c.length * SEG_LEN ] ] : [];
    return { notes: p.notes, taps: p.taps, stage: { open, rails: p.rails }, fermata, stats };
}

export const CONDUCTOR_VARIANTS: VariantSpec[] = [
    {
        id: 'conductor',
        label: 'Conductor 4/4 in half time: down, in, out, up over every 2 bars',
        emit: 'corridor',
        rules: [
            {
                from: 'every 2 bars',
                to: 'DOWN · IN · OUT · UP',
                detail: 'a jump lands on the downbeat, IN (left) on beat 3, OUT (right) on the next downbeat, UP is the jump that lands on the downbeat after',
            },
            {
                from: 'section label',
                to: 'stroke size',
                detail: 'quiet l / r, high L / R; the first cycle of each 4-bar phrase goes one size up (quiet L, high !L)',
            },
            {
                from: `kick / snare hits ≥ 0.5 in the 2 bars`,
                to: 'feel',
                detail: `≤ ${ LEGATO_MAX_HITS }: legato, held < >. ≥ ${ STACCATO_MIN_HITS }: staccato, accented snaps and a tap UP (j)`,
            },
            {
                from: 'high sections, 2nd cycle of each phrase',
                to: 'echo',
                detail: 'DOWN · IN · J on the OUT slot · j landing on the next downbeat',
            },
            {
                from: 'last cycle before a high section',
                to: 'prep rails',
                detail: `4u sealed rails on the calm tube for the last ${ PREP_RAIL_Z }u before the UP takeoff`,
            },
            {
                from: `first bar with energy < ${ FERMATA_ENERGY }`,
                to: 'fermata',
                detail: 'the last UP lands on that downbeat; no moves after it, open track to the end',
            },
            { from: 'bar energy', to: 'wall reach', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
        ],
        make: ( a, c, seed ) => {
            const curve = barCurve( a, c, rescale( smooth( a.energy, 1 ) ) );
            const placed = placeConductor( a, c );
            const score = {
                seed,
                length: c.length,
                curve,
                phrases: phrasesOf( placed.notes, curve ),
                notes: placed.notes,
            };
            const params = {
                ...placed.stats,
                fermata: placed.fermata,
                taps: placed.taps.length,
                placed: placed.notes.filter( ( n ) => n.kind !== 'rest' ).length,
            };
            const build: LabBuild = { kind: 'direct', seed, length: c.length, zPerBeat: c.zPerBeat, params };
            return { build, score, motifs: null, taps: placed.taps, stage: placed.stage };
        },
    },
];
