import type { FlightTuning } from '../constants.js';
import type { Track } from '../sim/space.js';
import { measureDemand, type PacingDemand } from './demand.js';
import { CELL_AIR, type FrozenTrack, nearestColumn, PACING_DZ, type PacingGrid } from './grid.js';
import { blockFree, type HoleMeasure, measureHole } from './jump-window.js';
import { type ReferencePath, type ScopedPath, scopedPath } from './reference-path.js';
import type { PacingRoutes, RouteArm, RouteFork, RouteNode } from './route-graph.js';

export const ARM_METRIC_EPS = 1e-4;

export interface ArmMetrics {
    lateral: number;
    reversals: number;
    peakStrafe: number;
    jumps: number;
    air: number;
}

export interface ArmGap extends HoleMeasure {
    k0: number;
    forced: boolean;
}

export interface ArmReport extends ArmMetrics {
    k0: number;
    cost: number;
    hardCost: number;
    stuck: number;
    barred: number;
    dominated: boolean;
    path: ReferencePath;
    gaps: ArmGap[];
}

export interface ForkArms {
    fork: number;
    arms: ArmReport[];
    easiest: number;
    hardest: number;
}

export interface NamedRoute extends ArmMetrics {
    path: ReferencePath;
    demand: PacingDemand;
    choice: number[];
    stuck: number;
    barred: number;
}

export interface PacingArms {
    forks: ForkArms[];
    easiest: NamedRoute;
    hardest: NamedRoute;
}

interface ArmContext {
    grid: PacingGrid;
    nodes: RouteNode[];
    forks: RouteFork[];
    viable: Uint8Array;
    mask: Uint8Array;
    cruise: number;
    airLimit: number;
    tuning: FlightTuning;
    bare: Track;
    gaps: Map< number, ArmGap >;
}

interface PathWindow {
    k0: number;
    k1: number;
    starts: number[];
}

const METRICS: readonly ( keyof ArmMetrics )[] = [ 'lateral', 'reversals', 'peakStrafe', 'jumps', 'air' ];

function paintRow( mask: Uint8Array, grid: PacingGrid, n: RouteNode, k: number, value: number ): void {
    const row = k * grid.cols;
    mask.fill( value, row + n.lo[ k - n.k0 ], row + n.hi[ k - n.k0 ] + 1 );
}

function paint( mask: Uint8Array, grid: PacingGrid, nodes: RouteNode[], ids: Iterable< number >, value: number ): void {
    for ( const id of ids ) {
        const n = nodes[ id ];
        for ( let k = n.k0; k <= n.k1; k++ ) paintRow( mask, grid, n, k, value );
    }
}

function windowOf( nodes: RouteNode[], fork: RouteFork, count: number ): PathWindow {
    const split = nodes[ fork.split ];
    const last = split.k1 - split.k0;
    const starts: number[] = [];
    for ( let j = split.lo[ last ]; j <= split.hi[ last ]; j++ ) starts.push( j );
    return { k0: split.k1, k1: fork.merge < 0 ? count - 1 : nodes[ fork.merge ].k0, starts };
}

function solveArm( ctx: ArmContext, fork: RouteFork, arm: RouteArm, off: Iterable< number > ): ScopedPath {
    const { mask, grid, nodes } = ctx;
    const w = windowOf( nodes, fork, grid.count );
    const edges = ( value: number ): void => {
        paintRow( mask, grid, nodes[ fork.split ], w.k0, value );
        if ( fork.merge >= 0 ) paintRow( mask, grid, nodes[ fork.merge ], w.k1, value );
    };
    paint( mask, grid, nodes, arm.nodes, 1 );
    paint( mask, grid, nodes, off, 0 );
    edges( 1 );
    const out = scopedPath( grid, ctx.cruise, ctx.airLimit, { starts: w.starts, mask, k0: w.k0, k1: w.k1 } );
    paint( mask, grid, nodes, arm.nodes, 0 );
    edges( 0 );
    return out;
}

function sum( a: ArrayLike< number > ): number {
    let s = 0;
    for ( let i = 0; i < a.length; i++ ) s += a[ i ];
    return s;
}

function metricsOf( path: ReferencePath, cruise: number ): { metrics: ArmMetrics; demand: PacingDemand } {
    const demand = measureDemand( path, cruise );
    let lateral = 0;
    for ( let k = 1; k < path.x.length; k++ ) lateral += Math.abs( path.x[ k ] - path.x[ k - 1 ] );
    let peakStrafe = 0;
    for ( const v of demand.strafe ) peakStrafe = Math.max( peakStrafe, v );
    return {
        metrics: {
            lateral,
            reversals: demand.bins.reduce( ( s, b ) => s + b.reversals, 0 ),
            peakStrafe,
            jumps: demand.bins.reduce( ( s, b ) => s + b.jumps, 0 ),
            air: sum( path.air ) * PACING_DZ,
        },
        demand,
    };
}

function columnRun( grid: PacingGrid, j: number, k: number ): [ number, number ] {
    const { cols, cells, count } = grid;
    let a = k;
    while ( a > 0 && cells[ ( a - 1 ) * cols + j ] === CELL_AIR ) a--;
    let b = k;
    while ( b < count && cells[ b * cols + j ] === CELL_AIR ) b++;
    return [ a, b ];
}

function rowForced( grid: PacingGrid, viable: Uint8Array, k: number ): boolean {
    let any = false;
    for ( let j = 0; j < grid.cols; j++ ) {
        const i = k * grid.cols + j;
        if ( viable[ i ] === 0 ) continue;
        if ( grid.cells[ i ] !== CELL_AIR ) return false;
        any = true;
    }
    return any;
}

function gapAt( ctx: ArmContext, j: number, a: number, b: number ): ArmGap {
    const key = a * ctx.grid.cols + j;
    const hit = ctx.gaps.get( key );
    if ( hit !== undefined ) return hit;
    let forced = false;
    for ( let k = a; k < b && ! forced; k++ ) forced = rowForced( ctx.grid, ctx.viable, k );
    const gap = { ...measureHole( ctx.bare, ctx.tuning, { j, k0: a, len: b - a } ), k0: a, forced };
    ctx.gaps.set( key, gap );
    return gap;
}

function armGaps( ctx: ArmContext, path: ReferencePath, k0: number ): ArmGap[] {
    const out: ArmGap[] = [];
    let k = 0;
    while ( k < path.air.length ) {
        if ( path.air[ k ] === 0 ) {
            k++;
            continue;
        }
        const j = nearestColumn( path.x[ k ] );
        const [ a, b ] = columnRun( ctx.grid, j, k0 + k );
        out.push( gapAt( ctx, j, a, b ) );
        while ( k < path.air.length && path.air[ k ] === 1 ) k++;
    }
    return out;
}

function armReport( ctx: ArmContext, fork: RouteFork, arm: RouteArm ): ArmReport {
    const { path, k0, cost, barred } = solveArm( ctx, fork, arm, [] );
    return {
        ...metricsOf( path, ctx.cruise ).metrics,
        k0,
        cost,
        hardCost: cost,
        stuck: sum( path.stuck ),
        barred,
        dominated: false,
        path,
        gaps: armGaps( ctx, path, k0 ),
    };
}

function dominates( a: ArmMetrics, b: ArmMetrics ): boolean {
    return (
        METRICS.every( ( m ) => a[ m ] <= b[ m ] + ARM_METRIC_EPS ) &&
        METRICS.some( ( m ) => a[ m ] < b[ m ] - ARM_METRIC_EPS )
    );
}

function argBy( values: number[], better: ( a: number, b: number ) => boolean ): number {
    let best = 0;
    for ( let i = 1; i < values.length; i++ ) if ( better( values[ i ], values[ best ] ) ) best = i;
    return best;
}

function armOf( nodes: RouteNode[], fork: RouteFork, path: ReferencePath ): number {
    let best = -1;
    let bestHits = 0;
    fork.arms.forEach( ( arm, a ) => {
        let hits = 0;
        for ( const id of arm.nodes ) {
            const n = nodes[ id ];
            for ( let k = n.k0; k <= n.k1; k++ ) {
                const j = nearestColumn( path.x[ k ] );
                if ( j >= n.lo[ k - n.k0 ] && j <= n.hi[ k - n.k0 ] ) hits++;
            }
        }
        if ( hits > bestHits ) {
            best = a;
            bestHits = hits;
        }
    } );
    return best;
}

function namedRoute( ctx: ArmContext, forks: ForkArms[], path: ReferencePath, barred: number ): NamedRoute {
    const { metrics, demand } = metricsOf( path, ctx.cruise );
    return {
        ...metrics,
        path,
        demand,
        choice: forks.map( ( fa ) => armOf( ctx.nodes, ctx.forks[ fa.fork ], path ) ),
        stuck: sum( path.stuck ),
        barred,
    };
}

function hardPass( ctx: ArmContext, forks: ForkArms[] ): Set< number > {
    const off = new Set< number >();
    const order = [ ...forks ].sort( ( a, b ) => ctx.forks[ a.fork ].length - ctx.forks[ b.fork ].length );
    for ( const fa of order ) {
        const fork = ctx.forks[ fa.fork ];
        fork.arms.forEach( ( arm, a ) => {
            fa.arms[ a ].hardCost = solveArm( ctx, fork, arm, off ).cost;
        } );
        fa.hardest = argBy(
            fa.arms.map( ( r ) => r.hardCost ),
            ( a, b ) => a > b,
        );
        fork.arms.forEach( ( arm, a ) => {
            if ( a !== fa.hardest ) for ( const id of arm.nodes ) off.add( id );
        } );
    }
    return off;
}

export function analyzeArms(
    frozen: FrozenTrack,
    grid: PacingGrid,
    routes: PacingRoutes,
    easiest: ReferencePath,
    tuning: FlightTuning,
    cruise: number,
    startX = 0,
): PacingArms {
    const ctx: ArmContext = {
        grid,
        nodes: routes.nodes,
        forks: routes.forks,
        viable: routes.viable,
        mask: new Uint8Array( grid.cells.length ),
        cruise,
        airLimit: easiest.airLimit,
        tuning,
        bare: blockFree( frozen.track ),
        gaps: new Map(),
    };
    const forks: ForkArms[] = [];
    routes.forks.forEach( ( fork, i ) => {
        if ( fork.kind !== 'fork' ) return;
        const arms = fork.arms.map( ( arm ) => armReport( ctx, fork, arm ) );
        for ( const r of arms ) r.dominated = arms.some( ( o ) => o !== r && dominates( o, r ) );
        const easy = argBy(
            arms.map( ( r ) => r.cost ),
            ( a, b ) => a < b,
        );
        forks.push( { fork: i, arms, easiest: easy, hardest: easy } );
    } );
    const off = hardPass( ctx, forks );
    const mask = Uint8Array.from( routes.viable );
    paint( mask, grid, routes.nodes, off, 0 );
    const hard = scopedPath( grid, cruise, easiest.airLimit, { starts: [ nearestColumn( startX ) ], mask } );
    return {
        forks,
        easiest: namedRoute( ctx, forks, easiest, 0 ),
        hardest: namedRoute( ctx, forks, hard.path, hard.barred ),
    };
}
