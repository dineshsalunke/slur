import type { FlightTuning } from '../constants.js';
import type { PlayerInput } from '../sim/input.js';
import { SEG_LEN, type Segment, type Track } from '../sim/space.js';
import { simulate } from '../sim/step.js';
import { spawnShip } from '../sim/types.js';
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

export type JumpMode = 'single' | 'double';

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
const SCAN_BEFORE = 48;
const SCAN_AFTER = 8;
const REFINE_STEPS = 7;

interface JumpPilot {
    input: PlayerInput;
    fired: boolean;
    released: boolean;
}

function steer( p: JumpPilot, mode: JumpMode, z: number, takeoffZ: number, y: number, vy: number ): void {
    if ( ! p.fired ) {
        if ( z >= takeoffZ ) {
            p.fired = true;
            p.input.jump = true;
        }
        return;
    }
    if ( mode === 'single' ) return;
    if ( ! p.released ) {
        if ( vy <= 0 ) {
            p.released = true;
            p.input.jump = false;
        }
        return;
    }
    p.input.jump = y < DOUBLE_PRESS_Y && vy < 0;
}

export function airDistance( tuning: FlightTuning, mode: JumpMode ): number {
    const s = spawnShip( 0, 0 );
    s.vz = tuning.maxCruise;
    const pilot: JumpPilot = {
        input: { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false },
        fired: false,
        released: false,
    };
    let z0: number | null = null;
    for ( let n = 0; n < MAX_TICKS; n++ ) {
        steer( pilot, mode, s.z, 0, s.y, s.vy );
        simulate( s, pilot.input, DT, tuning );
        if ( z0 === null && ! s.grounded ) z0 = s.z;
        if ( z0 !== null && s.grounded ) return s.z - z0;
    }
    return 0;
}

function blockFree( track: Track ): Track {
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
    const pilot: JumpPilot = {
        input: { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false },
        fired: false,
        released: false,
    };
    for ( let n = 0; n < MAX_TICKS; n++ ) {
        steer( pilot, mode, s.z, takeoffZ, s.y, s.vy );
        simulate( s, pilot.input, DT, tuning, track );
        if ( s.dead ) return false;
        if ( s.z >= exitZ && s.grounded ) return pilot.fired;
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

interface Hole {
    j: number;
    k0: number;
    len: number;
}

function holeAt( grid: PacingGrid, j: number, k0: number, k1: number ): Hole | null {
    const { cols, cells } = grid;
    let best: Hole | null = null;
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

function deepestHole( grid: PacingGrid, k0: number, k1: number ): Hole | null {
    let best: Hole | null = null;
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
        let jumpK = -1;
        for ( let k = k0; k < k1; k++ ) {
            if ( path.air[ k ] === 1 ) {
                jumpK = k;
                break;
            }
        }
        const jumped = jumpK >= 0;
        const hole = jumped ? holeAt( grid, nearestColumn( path.x[ jumpK ] ), k0, k1 ) : deepestHole( grid, k0, k1 );
        const forced = ! groundThreads( grid, k0, k1, path.maxStep );
        const base = { i0, i1, z0, z1, forced, jumped };
        if ( hole === null ) {
            out.push( { ...base, x: 0, lipZ: z0, holeLen: 0, single: null, double: null } );
            continue;
        }
        const x = columnX( hole.j );
        const lipZ = sampleZ( hole.k0 ) - PACING_DZ / 2;
        const holeLen = hole.len * PACING_DZ;
        const holeEnd = lipZ + holeLen;
        out.push( {
            ...base,
            x,
            lipZ,
            holeLen,
            single: takeoffWindow( bare, tuning, x, lipZ, holeEnd, 'single' ),
            double: takeoffWindow( bare, tuning, x, lipZ, holeEnd, 'double' ),
        } );
    }
    return out;
}
