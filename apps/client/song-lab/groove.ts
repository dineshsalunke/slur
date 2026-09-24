import {
    CELL,
    CONTRACT_TUNING,
    type ComposedNote,
    type MotifNote,
    mirrorNote,
    parseNotes,
    REGISTER_GAP_Z,
    SCORE_GATE_Z,
    SCORE_LINE_LIMIT,
    SCORE_PIN_Z,
    SEG_LEN,
    TRACK_CONTRACT,
} from '@slur/shared';
import type { Section } from '../tapper/beat-analysis.ts';
import type { LabBuild, LabEmit, LabRule } from './bundle.ts';
import { barCurve, padTo, phrasesOf, rescale, type SongClock, smooth, zAt } from './map.ts';
import { tapAirDistance } from './pilot.ts';
import type { LabSongAnalysis, VariantSpec } from './variants.ts';

export const GROOVE_NOTES = 'L R L R L R r l r l r r l r l r';
export const HOOK_STRAFE = '> r l !<';
export const HOOK_JUMP = 'J j';
export const HOOK_BARS = 4;
export const HIT_MIN_STRENGTH = 0.5;
export const OUTRO_ENERGY = 0.1;
export const TRIPLET_TOL = 0.15;

const CRUISE = TRACK_CONTRACT.registerCruise;

function snapUp( z: number ): number {
    return Math.ceil( z / SEG_LEN ) * SEG_LEN;
}

export const TAP_MOVE_S = tapAirDistance( CONTRACT_TUNING ) / CRUISE;

export function tapNote(): MotifNote {
    const j = parseNotes( 'J' )[ 0 ];
    return { ...j, move: TAP_MOVE_S, duration: snapUp( TAP_MOVE_S * CRUISE + REGISTER_GAP_Z ) };
}

export function floorOf( n: MotifNote, tight: boolean ): number {
    if ( ! tight || ( n.kind !== 'step' && n.kind !== 'held' ) ) return n.duration;
    return snapUp( Math.ceil( ( n.move * CRUISE ) / CELL ) * CELL + SCORE_GATE_Z + SCORE_PIN_Z );
}

interface Cue {
    note: MotifNote;
    tap: boolean;
    after: number;
}

interface Placing {
    c: SongClock;
    tight: boolean;
    notes: ComposedNote[];
    taps: number[];
    z: number;
    x: number;
}

function placeCue( p: Placing, cue: Cue, slots: readonly number[], endZ: number, phrase: number ): boolean {
    const floor = floorOf( cue.note, p.tight );
    for ( const t of slots ) {
        if ( t < cue.after - 1e-6 ) continue;
        const z = snapUp( zAt( p.c, t ) );
        if ( z < p.z ) continue;
        if ( z + floor > endZ ) return false;
        p.z = padTo( p.notes, p.z, z, p.x, phrase );
        p.x += cue.note.dir * cue.note.cells * CELL;
        p.notes.push( { ...cue.note, duration: floor, z, x: p.x, phrase } );
        if ( cue.tap ) p.taps.push( z );
        p.z = z + floor;
        return true;
    }
    return false;
}

function fitUnit( notes: readonly MotifNote[], x: number ): MotifNote[] | null {
    const ok = ( ns: readonly MotifNote[] ): boolean => {
        let at = x;
        for ( const n of ns ) {
            at += n.dir * n.cells * CELL;
            if ( Math.abs( at ) > SCORE_LINE_LIMIT ) return false;
        }
        return true;
    };
    if ( ok( notes ) ) return [ ...notes ];
    const m = notes.map( mirrorNote );
    return ok( m ) ? m : null;
}

function barTime( a: LabSongAnalysis, bar: number ): number {
    return a.bars[ bar ] ?? a.duration;
}

function beatLen( a: LabSongAnalysis, bar: number ): number {
    const t0 = barTime( a, bar );
    const t1 = a.bars[ bar + 1 ] ?? t0 + ( a.beatsPerBar * 60 ) / a.bpm;
    return ( t1 - t0 ) / a.beatsPerBar;
}

export function beatTimes( a: LabSongAnalysis, every = 1, from = 0 ): number[] {
    const out: number[] = [];
    a.bars.forEach( ( t, bar ) => {
        for ( let k = from; k < a.beatsPerBar; k += every ) out.push( t + k * beatLen( a, bar ) );
    } );
    return out;
}

export function hitTimes( a: LabSongAnalysis ): number[] {
    const drums = a.drums;
    if ( drums === undefined ) return [];
    const onGrid = ( inBar: number ) => Math.abs( inBar * 3 - Math.round( inBar * 3 ) ) <= TRIPLET_TOL;
    return [ ...drums.kick, ...drums.snare ]
        .filter( ( o ) => o.strength >= HIT_MIN_STRENGTH && onGrid( o.inBar ) )
        .map( ( o ) => o.t )
        .sort( ( p, q ) => p - q );
}

export interface GroovePlan {
    tight: boolean;
    grooveSlots: number[];
    hookSlots: number[];
}

export interface PlacedGroove {
    notes: ComposedNote[];
    taps: number[];
    grooves: number;
    hooks: number;
}

function hookCues( a: LabSongAnalysis, g: number, hook: number, x: number ): Cue[] {
    const beat = beatLen( a, g + 2 );
    if ( hook % 2 === 1 )
        return [
            { note: parseNotes( 'J' )[ 0 ], tap: false, after: barTime( a, g + 2 ) + 2 * beat },
            { note: tapNote(), tap: true, after: 0 },
        ];
    const strafe = parseNotes( HOOK_STRAFE );
    const unit = fitUnit( hook % 4 === 2 ? strafe.map( mirrorNote ) : strafe, x ) ?? [];
    const pins = [ barTime( a, g + 1 ), 0, 0, barTime( a, g + 3 ) + 2 * beat ];
    return unit.map( ( note, k ) => ( { note, tap: false, after: pins[ k ] ?? 0 } ) );
}

function placeHooks(
    a: LabSongAnalysis,
    p: Placing,
    s: Section,
    phrase: number,
    slots: readonly number[],
    hook: number,
): number {
    const end = zAt( p.c, barTime( a, s.toBar + 1 ) );
    let n = hook;
    for ( let g = s.fromBar; g + HOOK_BARS <= s.toBar; g += HOOK_BARS, n++ )
        for ( const cue of hookCues( a, g, n, p.x ) ) if ( ! placeCue( p, cue, slots, end, phrase ) ) break;
    return n;
}

function placeGrooves(
    a: LabSongAnalysis,
    p: Placing,
    s: Section,
    phrase: number,
    slots: readonly number[],
    rep: number,
): number {
    const groove = parseNotes( GROOVE_NOTES );
    const end = zAt( p.c, barTime( a, s.toBar ) );
    let after = barTime( a, s.fromBar );
    for ( let n = rep; ; n++ ) {
        const unit = fitUnit( n % 2 === 1 ? groove.map( mirrorNote ) : groove, p.x );
        if ( unit === null ) return n;
        for ( const note of unit ) {
            if ( ! placeCue( p, { note, tap: false, after }, slots, end, phrase ) ) return n;
            after = 0;
        }
    }
}

export function placeGroove( a: LabSongAnalysis, c: SongClock, plan: GroovePlan ): PlacedGroove {
    const p: Placing = { c, tight: plan.tight, notes: [], taps: [], z: c.z0, x: 0 };
    let grooves = 0;
    let hooks = 0;
    a.sections.forEach( ( s, phrase ) => {
        if ( s.energy < OUTRO_ENERGY ) return;
        if ( s.label === 'high' ) hooks = placeHooks( a, p, s, phrase, plan.hookSlots, hooks );
        else grooves = placeGrooves( a, p, s, phrase, plan.grooveSlots, grooves );
    } );
    return { notes: p.notes, taps: p.taps, grooves, hooks };
}

function grooveSpec( id: string, label: string, tight: boolean, emit: LabEmit, rules: LabRule[] ): VariantSpec {
    return {
        id,
        label,
        emit,
        rules: [
            {
                from: 'low / mid sections',
                to: GROOVE_NOTES,
                detail: 'the owner groove, repeated; every second repeat is mirrored',
            },
            {
                from: 'high sections, every 4 bars',
                to: `${ HOOK_STRAFE }  |  ${ HOOK_JUMP }`,
                detail: 'Believer hook on the beat grid, forms alternate. Strafe: held strafe, overshoot, settle, accented snap back on beat 3 of the last bar. Jump: full jump on beat 3 of bar 3, then a tap jump (j)',
            },
            ...rules,
            { from: 'bar energy', to: 'wall reach', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
        ],
        make: ( a, c, seed ) => {
            const plan: GroovePlan = tight
                ? { tight, grooveSlots: beatTimes( a, 2, 1 ), hookSlots: beatTimes( a ) }
                : { tight, grooveSlots: hitTimes( a ), hookSlots: beatTimes( a ) };
            const curve = barCurve( a, c, rescale( smooth( a.energy, 1 ) ) );
            const placed = placeGroove( a, c, plan );
            const score = {
                seed,
                length: c.length,
                curve,
                phrases: phrasesOf( placed.notes, curve ),
                notes: placed.notes,
            };
            const params = {
                grid: tight ? 'backbeat' : 'hits',
                tight,
                emit,
                minStrength: HIT_MIN_STRENGTH,
                grooves: placed.grooves,
                hooks: placed.hooks,
                taps: placed.taps.length,
                placed: placed.notes.filter( ( n ) => n.kind !== 'rest' ).length,
            };
            const build: LabBuild = { kind: 'direct', seed, length: c.length, zPerBeat: c.zPerBeat, params };
            return { build, score, motifs: null, taps: placed.taps };
        },
    };
}

export const GROOVE_VARIANTS: VariantSpec[] = [
    grooveSpec( 'groove', 'Owner groove + Believer hook, on the drum hits', false, 'corridor', [
        {
            from: 'kick / snare hit',
            to: 'next note',
            detail: `strength ≥ ${ HIT_MIN_STRENGTH }, triplet grid; a note waits for the first hit after its register gap`,
        },
    ] ),
    grooveSpec( 'groove-tight', 'Owner groove on every backbeat (breaks the register gap)', true, 'corridor', [
        {
            from: 'backbeat (beats 2 and 4)',
            to: 'next note',
            detail: 'one strafe per backbeat; the calm after a strafe is cut to fit, so this breaks the 0.5 s register gap',
        },
    ] ),
    grooveSpec( 'groove-open', 'Owner groove + Believer hook, open track (islands and gates)', false, 'open', [
        {
            from: 'kick / snare hit',
            to: 'next note',
            detail: `strength ≥ ${ HIT_MIN_STRENGTH }, triplet grid; a note waits for the first hit after its register gap`,
        },
        {
            from: 'walls',
            to: 'islands + gates',
            detail: 'only the calm-tube side rail (4u) and 2-post gates after each strafe; no far walls, no walls during a move',
        },
    ] ),
];
