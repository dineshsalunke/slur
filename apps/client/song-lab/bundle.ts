import {
    type ComposedScore,
    createSimWorld,
    DEFAULT_SIM_CONFIG,
    emitScore,
    FIXED_DT,
    type FlightTuning,
    type Motif,
    type PlayerInput,
    type Segment,
    SHIP_CLASSES,
    type ShipClassId,
    type SimShip,
    type SimWorld,
    segmentsTrack,
    simulate,
    spawnShip,
    type Track,
} from '@slur/shared';
import type { Section } from '../tapper/beat-analysis.ts';

export const LAB_BUNDLE_VERSION = 1;
export const LAB_MAX_TICKS = 27000;
export const LAB_TRACE_EVERY = 30;

export interface LabSong {
    file: string;
    duration: number;
    bpm: number;
    beatsPerBar: number;
    sections: Section[];
}

export interface LabBundle {
    version: typeof LAB_BUNDLE_VERSION;
    createdAt: string;
    song: LabSong;
    variants: LabVariant[];
}

export interface LabRule {
    from: string;
    to: string;
    detail: string;
}

export type LabBuild =
    | {
          kind: 'direct';
          seed: number;
          length: number;
          zPerBeat: number;
          params: Record< string, number | string | boolean >;
      }
    | {
          kind: 'compose';
          seed: number;
          length: number;
          library: 'standard' | 'mined';
          curve: number[] | null;
      };

export interface LabVariant {
    id: string;
    label: string;
    rules: LabRule[];
    build: LabBuild;
    motifs: Motif[] | null;
    score: ComposedScore;
    scoreString: string;
    phraseStrings: string[];
    intensity: number[];
    trackDigest: number;
    runs: LabRun[];
    humanRuns?: LabHumanRun[];
}

export type LabSkill = 'pro' | 'club' | 'rookie';

export interface LabPilotSpec {
    skill: LabSkill;
    seed: number;
    reactTicks: number;
    aimSigma: number;
    takeoffJitter: number;
}

export interface LabHumanRun extends LabRun {
    pilot: LabPilotSpec;
}

export type LabInputRun = [ ticks: number, throttle: number, brake: number, strafe: number, jump: 0 | 1 ];

export interface LabShipState {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
}

export interface LabResult {
    finished: boolean;
    ticks: number;
    time: number;
    deaths: number;
    deathZ: number[];
    bumps: number;
    bumpZ: number[];
    final: LabShipState;
}

export interface LabRun {
    classId: ShipClassId;
    inputs: LabInputRun[];
    result: LabResult;
    trace: number[];
}

export interface LabTally {
    ticks: number;
    deaths: number;
    deathZ: number[];
    bumps: number;
    bumpZ: number[];
    done: boolean;
}

export interface LabReplay {
    ship: SimShip;
    world: SimWorld;
    tally: LabTally;
    trace: number[];
}

export function labTrack( v: Pick< LabVariant, 'score' > ): Track {
    return segmentsTrack( emitScore( v.score ).segments, v.score.length );
}

export function fnv1a( text: string ): number {
    let h = 0x811c9dc5 | 0;
    for ( let i = 0; i < text.length; i++ ) h = Math.imul( h ^ text.charCodeAt( i ), 0x01000193 );
    return h >>> 0;
}

export function trackDigest( segments: readonly Segment[] ): number {
    return fnv1a( JSON.stringify( segments ) );
}

export function labDigest( v: Pick< LabVariant, 'score' > ): number {
    return trackDigest( emitScore( v.score ).segments );
}

export function classTuning( classId: ShipClassId ): FlightTuning {
    return SHIP_CLASSES[ classId ].tuning;
}

export function newTally(): LabTally {
    return { ticks: 0, deaths: 0, deathZ: [], bumps: 0, bumpZ: [], done: false };
}

export function newReplay(): LabReplay {
    return { ship: spawnShip( 0, 0 ), world: createSimWorld(), tally: newTally(), trace: [] };
}

export function labStep(
    ship: SimShip,
    input: PlayerInput,
    tuning: FlightTuning,
    track: Track,
    world: SimWorld,
    tally: LabTally,
): void {
    if ( tally.done ) return;
    const wasDead = ship.dead;
    const wasStunned = ship.stunTimer > 0;
    simulate( ship, input, FIXED_DT, tuning, track, DEFAULT_SIM_CONFIG, world );
    tally.ticks++;
    if ( ! wasDead && ship.dead ) {
        tally.deaths++;
        tally.deathZ.push( ship.z );
    }
    if ( ! wasStunned && ship.stunTimer > 0 ) {
        tally.bumps++;
        tally.bumpZ.push( ship.z );
    }
    if ( ship.finished || tally.ticks >= LAB_MAX_TICKS ) tally.done = true;
}

export function recordTrace( r: LabReplay ): void {
    if ( r.tally.ticks % LAB_TRACE_EVERY === 0 ) r.trace.push( r.tally.ticks, r.ship.x, r.ship.z );
}

export function expandInputs( runs: readonly LabInputRun[] ): PlayerInput[] {
    const out: PlayerInput[] = [];
    for ( const [ ticks, throttle, brake, strafe, jump ] of runs )
        for ( let k = 0; k < ticks; k++ ) out.push( { seq: out.length, throttle, brake, strafe, jump: jump === 1 } );
    return out;
}

export function packInputs( inputs: readonly PlayerInput[] ): LabInputRun[] {
    const out: LabInputRun[] = [];
    for ( const i of inputs ) {
        const jump = i.jump ? 1 : 0;
        const last = out[ out.length - 1 ];
        if ( last && last[ 1 ] === i.throttle && last[ 2 ] === i.brake && last[ 3 ] === i.strafe && last[ 4 ] === jump )
            last[ 0 ]++;
        else out.push( [ 1, i.throttle, i.brake, i.strafe, jump ] );
    }
    return out;
}

export function shipState( s: SimShip ): LabShipState {
    return { x: s.x, y: s.y, z: s.z, vx: s.vx, vy: s.vy, vz: s.vz };
}

export function sameFinal( a: LabShipState, b: LabShipState ): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z && a.vx === b.vx && a.vy === b.vy && a.vz === b.vz;
}

export function labResult( r: LabReplay ): LabResult {
    return {
        finished: r.ship.finished,
        ticks: r.tally.ticks,
        time: r.tally.ticks * FIXED_DT,
        deaths: r.tally.deaths,
        deathZ: [ ...r.tally.deathZ ],
        bumps: r.tally.bumps,
        bumpZ: [ ...r.tally.bumpZ ],
        final: shipState( r.ship ),
    };
}

export function replayRun( track: Track, run: Pick< LabRun, 'classId' | 'inputs' > ): LabReplay {
    const r = newReplay();
    const tuning = classTuning( run.classId );
    for ( const input of expandInputs( run.inputs ) ) {
        if ( r.tally.done ) break;
        labStep( r.ship, input, tuning, track, r.world, r.tally );
        recordTrace( r );
    }
    return r;
}

export function sameResult( a: LabResult, b: LabResult ): boolean {
    return (
        a.finished === b.finished &&
        a.ticks === b.ticks &&
        a.deaths === b.deaths &&
        a.bumps === b.bumps &&
        sameFinal( a.final, b.final )
    );
}
