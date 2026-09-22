import { hash2, mulberry32 } from './rng.js';

const SALT_TOOTH = 0x6d3f1c05 | 0;

export const TOOTH_CHANCE = 0.5;
export const TOOTH_MIN_LANES = 2;
export const TOOTH_MAX_LANES = 5;
export const TOOTH_SPUR_LANES = 2;
export const TOOTH_SPUR_CHANCE = 0.5;
export const TOOTH_MAX_ROWS = 2;

export interface LaneRange {
    lo: number;
    hi: number;
}

export interface RimTooth {
    lo: number;
    hi: number;
    rows: number;
    front: boolean;
}

function runLanes( rnd: () => number, remaining: number ): number {
    const span = TOOTH_MAX_LANES - TOOTH_MIN_LANES + 1;
    return Math.min( remaining, TOOTH_MIN_LANES + Math.floor( rnd() * span ) );
}

function toothRows( rnd: () => number, lanes: number, maxRows: number ): number {
    if ( lanes > TOOTH_SPUR_LANES || maxRows < TOOTH_MAX_ROWS ) return 1;
    return rnd() < TOOTH_SPUR_CHANCE ? TOOTH_MAX_ROWS : 1;
}

function claim( taken: Set< number >, lo: number, hi: number ): boolean {
    for ( let l = lo; l <= hi; l++ ) {
        if ( taken.has( l ) ) return false;
    }
    for ( let l = lo; l <= hi; l++ ) taken.add( l );
    return true;
}

function toothRun(
    rnd: () => number,
    taken: Set< number >,
    lo: number,
    hi: number,
    maxRows: number,
    front: boolean,
): RimTooth | null {
    const wanted = rnd() < TOOTH_CHANCE;
    const rows = toothRows( rnd, hi - lo + 1, maxRows );
    if ( ! wanted || ! claim( taken, lo, hi ) ) return null;
    return { lo, hi, rows, front };
}

function rimPass(
    rnd: () => number,
    taken: Set< number >,
    hole: LaneRange,
    maxRows: number,
    front: boolean,
): RimTooth[] {
    const out: RimTooth[] = [];
    let lane = hole.lo;
    while ( lane <= hole.hi ) {
        const hi = lane + runLanes( rnd, hole.hi - lane + 1 ) - 1;
        const tooth = toothRun( rnd, taken, lane, hi, maxRows, front );
        if ( tooth ) out.push( tooth );
        lane = hi + 1;
    }
    return out;
}

export function rimTeeth( seed: number, i: number, holes: LaneRange[], maxRows: number ): RimTooth[] {
    const rnd = mulberry32( hash2( ( seed ^ SALT_TOOTH ) | 0, i ) );
    const taken = new Set< number >();
    const out: RimTooth[] = [];
    for ( const front of [ true, false ] ) {
        for ( const hole of holes ) out.push( ...rimPass( rnd, taken, hole, maxRows, front ) );
    }
    return out;
}
