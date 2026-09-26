import {
    GROOVE_BEAT_Z,
    GROOVE_GRAMMAR,
    type GrooveGrammar,
    jumpChance,
    pickWeighted,
    switchChance,
} from '../groove/grammar.js';
import {
    GROOVE_LINE_LIMIT,
    type GrooveArena,
    type GrooveEvent,
    type GrooveLine,
    type GrooveSection,
} from '../groove/line.js';
import { hash2, mulberry32 } from '../rng.js';
import { type Phrase, type PhrasePlan, phraseStartZ, snapCell } from './plan.js';

export const PHRASE_LEAD_BEATS = 1;
export const PHRASE_TAIL_BEATS = 1;

const SALT_PHRASE = 0x2c7f94a1 | 0;
const SALT_PHRASE_DIR = 0x5b0e3d67 | 0;

function landing( from: number, dir: number, dx: number ): number {
    const straight = from + dir * dx;
    if ( Math.abs( straight ) <= GROOVE_LINE_LIMIT ) return straight;
    const flipped = from - dir * dx;
    if ( Math.abs( flipped ) <= GROOVE_LINE_LIMIT ) return flipped;
    return Math.sign( straight ) * GROOVE_LINE_LIMIT;
}

function beatOf( z: number ): number {
    return ( z - phraseStartZ() ) / GROOVE_BEAT_Z;
}

export function composePhraseLine( seed: number, plan: PhrasePlan, g: GrooveGrammar = GROOVE_GRAMMAR ): GrooveLine {
    const events: GrooveEvent[] = [];
    const arenas: GrooveArena[] = [];
    const sections: GrooveSection[] = [];
    let x = 0;
    let dir = mulberry32( hash2( ( seed ^ SALT_PHRASE_DIR ) | 0, plan.length ) )() < 0.5 ? -1 : 1;
    const motif = ( p: Phrase, rand: () => number ): void => {
        const bg = g.bands[ p.act ];
        const last = p.z1 - PHRASE_TAIL_BEATS * GROOVE_BEAT_Z;
        sections.push( { band: p.act, beat0: beatOf( p.z0 ), beat1: beatOf( p.z1 ) } );
        for ( let z = snapCell( p.z0 + PHRASE_LEAD_BEATS * GROOVE_BEAT_Z ); z <= last; ) {
            const gap = 1 + pickWeighted( bg.gapBeats, rand() );
            const jump = rand() < jumpChance( p.act, g );
            const next = snapCell( z + gap * GROOVE_BEAT_Z );
            const base = { beat: beatOf( z ), z, band: p.act, nextZ: Math.min( next, p.z1 ) };
            if ( jump ) {
                events.push( { ...base, kind: 'jump', from: x, to: x, dx: 0 } );
            } else {
                if ( events.some( ( e ) => e.kind === 'strafe' ) && rand() < switchChance( g ) ) dir = -dir;
                const bin = pickWeighted( bg.dx, rand() );
                const to = landing( x, dir, ( bin + rand() ) * g.dxBin );
                dir = Math.sign( to - x ) || dir;
                events.push( { ...base, kind: 'strafe', from: x, to, dx: Math.abs( to - x ) } );
                x = to;
            }
            z = next;
        }
    };
    plan.phrases.forEach( ( p, k ) => {
        if ( p.kind === 'motif' ) motif( p, mulberry32( hash2( ( seed ^ SALT_PHRASE ) | 0, k ) ) );
        else arenas.push( { z0: p.z0, z1: p.z1 } );
    } );
    return { seed, length: plan.length, events, sections, arenas };
}
