import { TRACK_CONTRACT } from '../constants.js';
import {
    CELL_AIR,
    CELL_BLOCKED,
    CELL_GROUND,
    columnX,
    nearestColumn,
    PACING_DX,
    PACING_DZ,
    type PacingGrid,
} from './grid.js';

export const PATH_REVERSAL_COST = 2;
export const PATH_JUMP_COST = 4;
export const PATH_STUCK_COST = 10_000;

export interface ReferencePath {
    x: Float32Array;
    air: Uint8Array;
    stuck: Uint8Array;
    maxStep: number;
    airLimit: number;
}

export function maxColumnStep( cruise: number ): number {
    return Math.max( 1, Math.floor( ( TRACK_CONTRACT.weaveStrafeClamp * PACING_DZ ) / cruise / PACING_DX + 1e-9 ) );
}

function airRunInColumn( grid: PacingGrid, j: number, out: Uint16Array ): void {
    const { count, cols, cells } = grid;
    let k = 0;
    while ( k < count ) {
        if ( cells[ k * cols + j ] !== CELL_AIR ) {
            k++;
            continue;
        }
        let end = k;
        while ( end < count && cells[ end * cols + j ] === CELL_AIR ) end++;
        const len = Math.min( end - k, 65_535 );
        for ( let q = k; q < end; q++ ) out[ q * cols + j ] = len;
        k = end;
    }
}

export function airRunLengths( grid: PacingGrid ): Uint16Array {
    const out = new Uint16Array( grid.count * grid.cols );
    for ( let j = 0; j < grid.cols; j++ ) airRunInColumn( grid, j, out );
    return out;
}

const DIRS = 3;

function nextDir( prev: number, m: number ): number {
    if ( m < 0 ) return 1;
    if ( m > 0 ) return 2;
    return prev;
}

function stepOrder( maxStep: number ): number[] {
    const order: number[] = [ 0 ];
    for ( let m = 1; m <= maxStep; m++ ) order.push( -m, m );
    return order;
}

class PathSolver {
    readonly maxStep: number;
    readonly states: number;
    readonly pred: Int16Array;
    readonly order: number[];
    private readonly airRuns: Uint16Array;
    private readonly airSamples: number;
    private cost: Float64Array;
    private next: Float64Array;
    readonly grid: PacingGrid;

    constructor( grid: PacingGrid, cruise: number, airLimit: number ) {
        this.grid = grid;
        this.maxStep = maxColumnStep( cruise );
        this.order = stepOrder( this.maxStep );
        this.airRuns = airRunLengths( grid );
        this.airSamples = airLimit / PACING_DZ;
        this.states = grid.cols * DIRS;
        this.pred = new Int16Array( grid.count * this.states ).fill( -1 );
        this.cost = new Float64Array( this.states ).fill( Number.POSITIVE_INFINITY );
        this.next = new Float64Array( this.states );
    }

    legal( k: number, j: number ): boolean {
        const i = k * this.grid.cols + j;
        const c = this.grid.cells[ i ];
        if ( c === CELL_GROUND ) return true;
        if ( c === CELL_BLOCKED ) return false;
        return this.airRuns[ i ] <= this.airSamples;
    }

    start( j0: number ): void {
        this.cost[ j0 * DIRS ] = this.legal( 0, j0 ) ? 0 : PATH_STUCK_COST;
    }

    private relaxFrom( k: number, j: number, pj: number, m: number, extra: number ): void {
        for ( let pd = 0; pd < DIRS; pd++ ) {
            const base = this.cost[ pj * DIRS + pd ];
            if ( base === Number.POSITIVE_INFINITY ) continue;
            const nd = nextDir( pd, m );
            const turn = pd !== 0 && nd !== pd ? PATH_REVERSAL_COST : 0;
            const c = base + Math.abs( m ) * PACING_DX + turn + extra;
            const s = j * DIRS + nd;
            if ( c < this.next[ s ] ) {
                this.next[ s ] = c;
                this.pred[ k * this.states + s ] = pj * DIRS + pd;
            }
        }
    }

    private relaxCell( k: number, j: number ): void {
        const { cols, cells } = this.grid;
        const inAir = cells[ k * cols + j ] === CELL_AIR;
        const penalty = this.legal( k, j ) ? 0 : PATH_STUCK_COST;
        for ( const m of this.order ) {
            const pj = j - m;
            if ( pj < 0 || pj >= cols ) continue;
            const takeoff = inAir && cells[ ( k - 1 ) * cols + pj ] !== CELL_AIR ? PATH_JUMP_COST : 0;
            this.relaxFrom( k, j, pj, m, takeoff + penalty );
        }
    }

    advance( k: number ): void {
        this.next.fill( Number.POSITIVE_INFINITY );
        for ( let j = 0; j < this.grid.cols; j++ ) this.relaxCell( k, j );
        const swap = this.cost;
        this.cost = this.next;
        this.next = swap;
    }

    cheapest(): number {
        let best = 0;
        for ( let s = 1; s < this.states; s++ ) if ( this.cost[ s ] < this.cost[ best ] ) best = s;
        return best;
    }
}

export function referencePath( grid: PacingGrid, cruise: number, airLimit: number, startX = 0 ): ReferencePath {
    const solver = new PathSolver( grid, cruise, airLimit );
    solver.start( nearestColumn( startX ) );
    for ( let k = 1; k < grid.count; k++ ) solver.advance( k );

    const x = new Float32Array( grid.count );
    const air = new Uint8Array( grid.count );
    const stuck = new Uint8Array( grid.count );
    let s = solver.cheapest();
    for ( let k = grid.count - 1; k >= 0; k-- ) {
        const j = Math.floor( s / DIRS );
        x[ k ] = columnX( j );
        air[ k ] = grid.cells[ k * grid.cols + j ] === CELL_AIR ? 1 : 0;
        stuck[ k ] = solver.legal( k, j ) ? 0 : 1;
        if ( k > 0 ) s = solver.pred[ k * solver.states + s ];
    }
    return { x, air, stuck, maxStep: solver.maxStep, airLimit };
}
