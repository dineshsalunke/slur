import type { FlightTuning } from '../constants.js';
import type { PlayerInput } from '../sim/input.js';
import { SEG_LEN, type Segment, type Track } from '../sim/space.js';
import { simulate } from '../sim/step.js';
import { type SimShip, spawnShip } from '../sim/types.js';
import {
    CELL_AIR,
    CELL_GROUND,
    columnX,
    type FrozenTrack,
    nearestColumn,
    PACING_DZ,
    type PacingGrid,
    sampleZ,
} from './grid.js';
import type { ReferencePath } from './reference-path.js';

export type JumpMode = 'none' | 'single' | 'double';

export interface TakeoffWindow {
    from: number;
    to: number;
    seconds: number;
}

export interface PacingGap {
    i0: number;
    i1: number;
    z0: number;
    z1: number;
    forced: boolean;
    slot: boolean;
    rolls: boolean;
    jumped: boolean;
    x: number;
    lipZ: number;
    holeLen: number;
    single: TakeoffWindow | null;
    double: TakeoffWindow | null;
}

const DT = 1 / 60;
const RUNUP = 12;
const DOUBLE_PRESS_Y = 0.6;
const MAX_TICKS = 600;
const SCAN_BEFORE = 96;
const SCAN_AFTER = 8;
const REFINE_STEPS = 7;

export interface JumpPilot {
    input: PlayerInput;
    fired: boolean;
    airborne: boolean;
    done: boolean;
    released: boolean;
    second: boolean;
}

export function newJumpPilot(): JumpPilot {
    return {
        input: { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false },
        fired: false,
        airborne: false,
        done: false,
        released: false,
        second: false,
    };
}

function steerDouble( p: JumpPilot, s: SimShip ): void {
    if ( ! p.released ) {
        if ( s.vy <= 0 ) {
            p.released = true;
            p.input.jump = false;
        }
        return;
    }
    if ( ! p.second && s.y < DOUBLE_PRESS_Y && s.vy < 0 ) {
        p.second = true;
        p.input.jump = true;
    }
}

export function steerJump( p: JumpPilot, mode: JumpMode, s: SimShip, takeoffZ: number ): void {
    if ( mode === 'none' || p.done ) return;
    if ( ! p.fired ) {
        if ( s.z >= takeoffZ ) {
            p.fired = true;
            p.input.jump = true;
        }
        return;
    }
    if ( ! s.grounded ) p.airborne = true;
    else if ( p.airborne ) {
        p.done = true;
        p.input.jump = false;
        return;
    }
    if ( mode === 'double' ) steerDouble( p, s );
}

export function airDistance( tuning: FlightTuning, mode: JumpMode ): number {
    const s = spawnShip( 0, 0 );
    s.vz = tuning.maxCruise;
    const pilot = newJumpPilot();
    let z0: number | null = null;
    for ( let n = 0; n < MAX_TICKS; n++ ) {
        steerJump( pilot, mode, s, 0 );
        simulate( s, pilot.input, DT, tuning );
        if ( z0 === null && ! s.grounded ) z0 = s.z;
        if ( z0 !== null && s.grounded ) return s.z - z0;
    }
    return 0;
}

export function blockFree( track: Track ): Track {
    const cache = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        let s = cache.get( i );
        if ( s === undefined ) {
            s = { ...track.segmentAt( i ), blocks: [] };
            cache.set( i, s );
        }
        return s;
    };
    return {
        finishZ: track.finishZ,
        anchors: track.anchors,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( Math.floor( z / SEG_LEN ) ),
    };
}

export function clearsGap(
    track: Track,
    tuning: FlightTuning,
    x: number,
    takeoffZ: number,
    exitZ: number,
    mode: JumpMode,
): boolean {
    const s = spawnShip( x, takeoffZ - RUNUP );
    s.vz = tuning.maxCruise;
    const pilot = newJumpPilot();
    for ( let n = 0; n < MAX_TICKS; n++ ) {
        steerJump( pilot, mode, s, takeoffZ );
        simulate( s, pilot.input, DT, tuning, track );
        if ( s.dead ) return false;
        if ( s.z >= exitZ && s.grounded ) return mode === 'none' || pilot.fired;
    }
    return false;
}

function refine( ok: ( z: number ) => boolean, pass: number, fail: number ): number {
    let a = pass;
    let b = fail;
    for ( let n = 0; n < REFINE_STEPS; n++ ) {
        const m = ( a + b ) / 2;
        if ( ok( m ) ) a = m;
        else b = m;
    }
    return a;
}

export function takeoffWindow(
    track: Track,
    tuning: FlightTuning,
    x: number,
    lipZ: number,
    holeEnd: number,
    mode: JumpMode,
): TakeoffWindow | null {
    const exitZ = holeEnd + tuning.halfL + 2;
    const ok = ( z: number ): boolean => clearsGap( track, tuning, x, z, exitZ, mode );
    let first: number | null = null;
    let last: number | null = null;
    for ( let z = lipZ - SCAN_BEFORE; z <= lipZ + SCAN_AFTER; z += 1 ) {
        if ( ! ok( z ) ) continue;
        if ( first === null ) first = z;
        last = z;
    }
    if ( first === null || last === null ) return null;
    const from = refine( ok, first, first - 1 );
    const to = refine( ok, last, last + 1 );
    return { from: from - lipZ, to: to - lipZ, seconds: ( to - from ) / tuning.maxCruise };
}

function gapRanges( segments: Segment[] ): Array< [ number, number ] > {
    const out: Array< [ number, number ] > = [];
    let start: number | null = null;
    for ( let i = 0; i <= segments.length; i++ ) {
        const gap = i < segments.length && segments[ i ].kind === 'gap';
        if ( gap && start === null ) start = i;
        if ( ! gap && start !== null ) {
            out.push( [ start, i - 1 ] );
            start = null;
        }
    }
    return out;
}

function nearLive( live: Uint8Array, j: number, maxStep: number ): boolean {
    for ( let pj = Math.max( 0, j - maxStep ); pj <= Math.min( live.length - 1, j + maxStep ); pj++ ) {
        if ( live[ pj ] === 1 ) return true;
    }
    return false;
}

function groundThreads( grid: PacingGrid, k0: number, k1: number, maxStep: number ): boolean {
    const { cols, cells } = grid;
    let live = new Uint8Array( cols );
    for ( let j = 0; j < cols; j++ ) live[ j ] = cells[ k0 * cols + j ] === CELL_GROUND ? 1 : 0;
    for ( let k = k0 + 1; k < k1; k++ ) {
        const nextLive = new Uint8Array( cols );
        let any = false;
        for ( let j = 0; j < cols; j++ ) {
            if ( cells[ k * cols + j ] !== CELL_GROUND || ! nearLive( live, j, maxStep ) ) continue;
            nextLive[ j ] = 1;
            any = true;
        }
        if ( ! any ) return false;
        live = nextLive;
    }
    return true;
}

export interface PacingHole {
    j: number;
    k0: number;
    len: number;
}

export function holeAt( grid: PacingGrid, j: number, k0: number, k1: number ): PacingHole | null {
    const { cols, cells } = grid;
    let best: PacingHole | null = null;
    let k = k0;
    while ( k < k1 ) {
        if ( cells[ k * cols + j ] !== CELL_AIR ) {
            k++;
            continue;
        }
        let end = k;
        while ( end < k1 && cells[ end * cols + j ] === CELL_AIR ) end++;
        if ( best === null || end - k > best.len ) best = { j, k0: k, len: end - k };
        k = end;
    }
    return best;
}

function deepestHole( grid: PacingGrid, k0: number, k1: number ): PacingHole | null {
    let best: PacingHole | null = null;
    for ( let j = 0; j < grid.cols; j++ ) {
        const h = holeAt( grid, j, k0, k1 );
        if ( h !== null && ( best === null || h.len > best.len ) ) best = h;
    }
    return best;
}

export function measureGaps(
    frozen: FrozenTrack,
    grid: PacingGrid,
    path: ReferencePath,
    tuning: FlightTuning,
): PacingGap[] {
    const bare = blockFree( frozen.track );
    const out: PacingGap[] = [];
    for ( const [ i0, i1 ] of gapRanges( frozen.segments ) ) {
        const z0 = i0 * SEG_LEN;
        const z1 = ( i1 + 1 ) * SEG_LEN;
        const k0 = Math.round( z0 / PACING_DZ );
        const k1 = Math.min( Math.round( z1 / PACING_DZ ), grid.count );
        const jumpK = firstAir( path.air, k0, k1 );
        const jumped = jumpK >= 0;
        const hole = jumped ? holeAt( grid, nearestColumn( path.x[ jumpK ] ), k0, k1 ) : deepestHole( grid, k0, k1 );
        const forced = ! groundThreads( grid, k0, k1, path.maxStep );
        const slot = ! forced && i1 > i0 && hole !== null && hole.len >= k1 - k0 - 1;
        const base = { i0, i1, z0, z1, forced, slot, jumped };
        if ( hole === null ) out.push( { ...base, ...NO_HOLE, lipZ: z0 } );
        else if ( slot ) out.push( { ...base, ...holeShape( hole ), rolls: false, single: null, double: null } );
        else out.push( { ...base, ...measureHole( bare, tuning, hole ) } );
    }
    return out;
}

const NO_HOLE = { x: 0, holeLen: 0, rolls: true, single: null, double: null };

function holeShape( hole: PacingHole ): { x: number; lipZ: number; holeLen: number } {
    return { x: columnX( hole.j ), lipZ: sampleZ( hole.k0 ) - PACING_DZ / 2, holeLen: hole.len * PACING_DZ };
}

function firstAir( air: Uint8Array, k0: number, k1: number ): number {
    for ( let k = k0; k < k1; k++ ) if ( air[ k ] === 1 ) return k;
    return -1;
}

export interface HoleMeasure {
    x: number;
    lipZ: number;
    holeLen: number;
    rolls: boolean;
    single: TakeoffWindow | null;
    double: TakeoffWindow | null;
}

export function measureHole( bare: Track, tuning: FlightTuning, hole: PacingHole ): HoleMeasure {
    const { x, lipZ, holeLen } = holeShape( hole );
    const holeEnd = lipZ + holeLen;
    const rolls = clearsGap( bare, tuning, x, lipZ, holeEnd + tuning.halfL + 2, 'none' );
    if ( rolls ) return { x, lipZ, holeLen, rolls, single: null, double: null };
    return {
        x,
        lipZ,
        holeLen,
        rolls,
        single: takeoffWindow( bare, tuning, x, lipZ, holeEnd, 'single' ),
        double: takeoffWindow( bare, tuning, x, lipZ, holeEnd, 'double' ),
    };
}
