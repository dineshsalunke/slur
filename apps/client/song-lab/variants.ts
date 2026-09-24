import { type ComposedScore, composeScore, MOTIFS, type Motif, type NoteToken, parseMotif } from '@slur/shared';
import type { SongAnalysis } from '../tapper/beat-analysis.ts';
import type { LabBuild, LabEmit, LabRule } from './bundle.ts';
import { GROOVE_VARIANTS } from './groove.ts';
import {
    barAt,
    barCurve,
    breathAtSectionStarts,
    defaultCurve,
    placeEvents,
    rescale,
    type SongClock,
    type SongEvent,
    sectionBars,
    smooth,
} from './map.ts';
import { mineMotifs } from './mine.ts';

export interface DrumOnset {
    t: number;
    strength: number;
    beat: number;
    bar: number;
    inBar: number;
}

export interface DrumStreams {
    kick: DrumOnset[];
    snare: DrumOnset[];
    hats: DrumOnset[];
}

export type LabSongAnalysis = SongAnalysis & { drums?: DrumStreams };

export interface VariantBuild {
    build: LabBuild;
    score: ComposedScore;
    motifs: Motif[] | null;
    taps?: number[];
}

export interface VariantSpec {
    id: string;
    label: string;
    rules: LabRule[];
    emit?: LabEmit;
    make: ( a: LabSongAnalysis, c: SongClock, seed: number ) => VariantBuild;
}

type Drum = keyof DrumStreams;

interface DirectParams {
    jump: Drum;
    step: Drum;
    minStrength: number;
    strong: number;
    grid: Grid;
    steer: 'alternate' | 'sweep';
    restBars: number;
}

type Grid = 'beat' | 'triplet' | 'any';

const GRID_STEP: Record< Grid, number > = { beat: 1, triplet: 1 / 3, any: 0 };
const GRID_TOL = 0.15;

function energyBars( a: SongAnalysis ): number[] {
    return rescale( smooth( a.energy, 1 ) );
}

function compose( seed: number, c: SongClock, curve: number[] | null, library: 'standard' | 'mined', mined?: Motif[] ) {
    const motifs = mined === undefined ? MOTIFS : mined.map( parseMotif );
    const score = composeScore( seed, c.length, motifs, curve ?? undefined );
    const build: LabBuild = { kind: 'compose', seed, length: c.length, library, curve };
    return { build, score, motifs: mined ?? null };
}

function onGrid( o: DrumOnset, grid: Grid ): boolean {
    const step = GRID_STEP[ grid ];
    if ( step === 0 ) return true;
    const slots = o.inBar / step;
    return Math.abs( slots - Math.round( slots ) ) <= GRID_TOL;
}

function inRest( a: SongAnalysis, t: number, bars: number ): boolean {
    const bar = barAt( a, t );
    return a.sections.some( ( s ) => bar >= s.fromBar && bar < s.fromBar + bars );
}

export function drumEvents( a: LabSongAnalysis, p: DirectParams ): SongEvent[] {
    const drums = a.drums;
    if ( drums === undefined ) return [];
    const keep = ( o: DrumOnset ) =>
        o.strength >= p.minStrength && onGrid( o, p.grid ) && ! inRest( a, o.t, p.restBars );
    const jumps = drums[ p.jump ].filter( keep ).map(
        ( o ): SongEvent => ( {
            t: o.t,
            token: o.strength >= p.strong ? 'JJ' : 'J',
            accent: false,
        } ),
    );
    return [ ...jumps, ...stepEvents( drums[ p.step ].filter( keep ), p ) ];
}

const SWEEP_STEPS = 3;

function stepToken( side: number, big: boolean ): NoteToken {
    if ( side < 0 ) return big ? 'L' : 'l';
    return big ? 'R' : 'r';
}

function stepEvents( onsets: readonly DrumOnset[], p: DirectParams ): SongEvent[] {
    let side = 1;
    let run = 0;
    return onsets.map( ( o ) => {
        const e: SongEvent = { t: o.t, token: stepToken( side, o.strength >= p.strong ), accent: false };
        run++;
        if ( p.steer === 'alternate' || run >= SWEEP_STEPS ) {
            side = -side;
            run = 0;
        }
        return e;
    } );
}

function direct( id: string, label: string, p: DirectParams ): VariantSpec {
    const rules: LabRule[] = [
        { from: p.jump, to: 'J', detail: `strength ≥ ${ p.minStrength }, on the ${ p.grid } grid` },
        { from: p.jump, to: 'JJ', detail: `strength ≥ ${ p.strong }` },
        { from: p.step, to: 'l / r', detail: `strength ≥ ${ p.minStrength }, steer ${ p.steer }` },
        { from: p.step, to: 'L / R', detail: `strength ≥ ${ p.strong }` },
        { from: 'section start', to: 'rest', detail: `${ p.restBars } bar(s) of no notes` },
        { from: 'bar energy', to: 'wall reach', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
        { from: 'overlap', to: 'drop', detail: 'an event inside the previous note is dropped' },
    ];
    return {
        id,
        label,
        rules,
        make: ( a, c, seed ) => {
            const curve = barCurve( a, c, energyBars( a ) );
            const events = drumEvents( a, p );
            const score = placeEvents( a, c, seed, events, curve );
            const placed = score.notes.filter( ( n ) => n.kind !== 'rest' ).length;
            const params = { ...p, events: events.length, placed, dropped: events.length - placed };
            const build: LabBuild = { kind: 'direct', seed, length: c.length, zPerBeat: c.zPerBeat, params };
            return { build, score, motifs: null };
        },
    };
}

const SNARE_JUMP: DirectParams = {
    jump: 'snare',
    step: 'kick',
    minStrength: 0.5,
    strong: 0.85,
    grid: 'beat',
    steer: 'alternate',
    restBars: 1,
};

export const COMPOSE_VARIANTS: VariantSpec[] = [
    {
        id: 'envelope',
        label: 'Control: standard library, default envelope',
        rules: [ { from: 'nothing', to: 'score', detail: 'composeScore(seed, songLength): the song is ignored' } ],
        make: ( _a, c, seed ) => compose( seed, c, null, 'standard' ),
    },
    {
        id: 'section-energy',
        label: 'Section energy → intensity',
        rules: [
            { from: 'section energy', to: 'intensity', detail: 'per bar, rescaled 0.15–1' },
            { from: 'intensity', to: 'motif band + breaths + wall reach', detail: 'standard library' },
        ],
        make: ( a, c, seed ) => compose( seed, c, barCurve( a, c, rescale( sectionBars( a ) ) ), 'standard' ),
    },
    {
        id: 'bar-energy',
        label: 'Bar energy → intensity',
        rules: [
            { from: 'bar energy', to: 'intensity', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
            { from: 'intensity', to: 'motif band + breaths + wall reach', detail: 'standard library' },
        ],
        make: ( a, c, seed ) => compose( seed, c, barCurve( a, c, energyBars( a ) ), 'standard' ),
    },
    {
        id: 'bar-energy-breaths',
        label: 'Bar energy → intensity, rest at each section start',
        rules: [
            { from: 'bar energy', to: 'intensity', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
            { from: 'section start', to: 'rest', detail: 'first bar of each section at intensity 0' },
        ],
        make: ( a, c, seed ) =>
            compose( seed, c, barCurve( a, c, breathAtSectionStarts( a, energyBars( a ), 1 ) ), 'standard' ),
    },
];

export const DRUM_VARIANTS: VariantSpec[] = [
    direct( 'snare-jump', 'Snare → jump, kick → strafe (alternate)', SNARE_JUMP ),
    direct( 'snare-jump-sweep', 'Snare → jump, kick → strafe (sweeps of 3)', { ...SNARE_JUMP, steer: 'sweep' } ),
    direct( 'kick-jump', 'Kick → jump, snare → strafe', { ...SNARE_JUMP, jump: 'kick', step: 'snare' } ),
    direct( 'triplet-grid', 'Snare → jump, kick → strafe, on the triplet grid', {
        ...SNARE_JUMP,
        minStrength: 0.35,
        grid: 'triplet',
    } ),
    {
        id: 'hat-density',
        label: 'Hat density → intensity',
        rules: [
            { from: 'hats per bar', to: 'intensity', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
            { from: 'intensity', to: 'motif band + breaths + wall reach', detail: 'standard library' },
        ],
        make: ( a, c, seed ) => {
            const counts = a.bars.map( ( _, bar ) => ( a.drums?.hats ?? [] ).filter( ( o ) => o.bar === bar ).length );
            return compose( seed, c, barCurve( a, c, rescale( smooth( counts, 1 ) ) ), 'standard' );
        },
    },
    {
        id: 'mined',
        label: 'Motifs mined from snare-jump, bar energy → intensity',
        rules: [
            { from: 'snare-jump notes', to: 'motifs', detail: 'most common 3–5 note runs that fly clean' },
            { from: 'bar energy', to: 'intensity', detail: 'smoothed ±1 bar, rescaled 0.15–1' },
            { from: 'motif band', to: 'bar energy where the run was heard', detail: '±0.1' },
        ],
        make: ( a, c, seed ) => {
            const source = placeEvents( a, c, seed, drumEvents( a, SNARE_JUMP ), barCurve( a, c, energyBars( a ) ) );
            const mined = mineMotifs( source );
            return compose( seed, c, barCurve( a, c, energyBars( a ) ), 'mined', mined );
        },
    },
];

export function variantsFor( a: LabSongAnalysis ): VariantSpec[] {
    return a.drums === undefined ? COMPOSE_VARIANTS : [ ...COMPOSE_VARIANTS, ...DRUM_VARIANTS, ...GROOVE_VARIANTS ];
}

export function intensityOf( score: ComposedScore ): number[] {
    return score.curve !== undefined ? [ ...score.curve ] : defaultCurve( score.length );
}
