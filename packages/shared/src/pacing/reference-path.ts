import { TRACK_CONTRACT } from '../constants.js';
import { CELL_AIR, CELL_GROUND, columnX, nearestColumn, PACING_DX, PACING_DZ, type PacingGrid } from './grid.js';

export const PATH_REVERSAL_COST = 2;
export const PATH_JUMP_COST = 4;
export const PATH_STUCK_COST = 10_000;
export const PATH_BARRED_COST = 1_000;

export interface ReferencePath {
    x: Float32Array;
    air: Uint8Array;
    stuck: Uint8Array;
    maxStep: number;
    airLimit: number;
}

export interface PathScope {
    starts: number[];
    mask?: Uint8Array;
    k0?: number;
    k1?: number;
}

export interface ScopedPath {
    path: ReferencePath;
    k0: number;
    cost: number;
    barred: number;
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

function crossingRows( grid: PacingGrid, maxStep: number ): Uint16Array {
    const { count, cols, cells } = grid;
    const out = new Uint16Array( count * cols );
    for ( let k = 0; k < count; k++ ) {
        let j = 0;
        while ( j < cols ) {
            if ( cells[ k * cols + j ] !== CELL_AIR ) {
                j++;
                continue;
            }
            let e = j;
            while ( e < cols && cells[ k * cols + e ] === CELL_AIR ) e++;
            const rows = Math.ceil( ( e - j ) / maxStep );
            for ( let q = j; q < e; q++ ) out[ k * cols + q ] = rows;
            j = e;
        }
    }
    return out;
}

export function legalMask( grid: PacingGrid, airLimit: number, maxStep: number ): Uint8Array {
    const airSamples = airLimit / PACING_DZ;
    const runs = airRunLengths( grid );
    const across = crossingRows( grid, maxStep );
    const out = new Uint8Array( grid.cells.length );
    for ( let i = 0; i < out.length; i++ ) {
        const c = grid.cells[ i ];
        if ( c === CELL_GROUND ) out[ i ] = 1;
        else if ( c === CELL_AIR ) out[ i ] = runs[ i ] <= airSamples || across[ i ] <= airSamples ? 1 : 0;
    }
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
    readonly origin: number;
    private readonly legalCells: Uint8Array;
    private readonly mask: Uint8Array | null;
    private cost: Float64Array;
    private next: Float64Array;
    readonly grid: PacingGrid;

    constructor(
        grid: PacingGrid,
        cruise: number,
        airLimit: number,
        origin: number,
        rows: number,
        mask: Uint8Array | null,
    ) {
        this.grid = grid;
        this.origin = origin;
        this.mask = mask;
        this.maxStep = maxColumnStep( cruise );
        this.order = stepOrder( this.maxStep );
        this.legalCells = legalMask( grid, airLimit, this.maxStep );
        this.states = grid.cols * DIRS;
        this.pred = new Int16Array( rows * this.states ).fill( -1 );
        this.cost = new Float64Array( this.states ).fill( Number.POSITIVE_INFINITY );
        this.next = new Float64Array( this.states );
    }

    legal( k: number, j: number ): boolean {
        return this.legalCells[ k * this.grid.cols + j ] === 1;
    }

    barred( k: number, j: number ): boolean {
        return this.mask !== null && this.mask[ k * this.grid.cols + j ] === 0;
    }

    penalty( k: number, j: number ): number {
        return ( this.legal( k, j ) ? 0 : PATH_STUCK_COST ) + ( this.barred( k, j ) ? PATH_BARRED_COST : 0 );
    }

    start( starts: number[] ): void {
        for ( const j of starts ) this.cost[ j * DIRS ] = this.penalty( this.origin, j );
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
                this.pred[ ( k - this.origin ) * this.states + s ] = pj * DIRS + pd;
            }
        }
    }

    private relaxCell( k: number, j: number ): void {
        const { cols, cells } = this.grid;
        const inAir = cells[ k * cols + j ] === CELL_AIR;
        const penalty = this.penalty( k, j );
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

    costOf( s: number ): number {
        return this.cost[ s ];
    }
}

export function scopedPath( grid: PacingGrid, cruise: number, airLimit: number, scope: PathScope ): ScopedPath {
    const k0 = scope.k0 ?? 0;
    const k1 = scope.k1 ?? grid.count - 1;
    const rows = k1 - k0 + 1;
    const solver = new PathSolver( grid, cruise, airLimit, k0, rows, scope.mask ?? null );
    solver.start( scope.starts );
    for ( let k = k0 + 1; k <= k1; k++ ) solver.advance( k );

    const x = new Float32Array( rows );
    const air = new Uint8Array( rows );
    const stuck = new Uint8Array( rows );
    let s = solver.cheapest();
    const cost = solver.costOf( s );
    let barred = 0;
    for ( let k = k1; k >= k0; k-- ) {
        const j = Math.floor( s / DIRS );
        x[ k - k0 ] = columnX( j );
        air[ k - k0 ] = grid.cells[ k * grid.cols + j ] === CELL_AIR ? 1 : 0;
        stuck[ k - k0 ] = solver.legal( k, j ) ? 0 : 1;
        if ( solver.barred( k, j ) ) barred++;
        if ( k > k0 ) s = solver.pred[ ( k - k0 ) * solver.states + s ];
    }
    return { path: { x, air, stuck, maxStep: solver.maxStep, airLimit }, k0, cost, barred };
}

export function referencePath( grid: PacingGrid, cruise: number, airLimit: number, startX = 0 ): ReferencePath {
    return scopedPath( grid, cruise, airLimit, { starts: [ nearestColumn( startX ) ] } ).path;
}
