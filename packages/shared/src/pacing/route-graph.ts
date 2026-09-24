import { MAX_SHIP_WIDTH, TRACK_CONTRACT } from '../constants.js';
import {
    buildGrid,
    CELL_AIR,
    CONTRACT_HULL,
    type FrozenTrack,
    PACING_DX,
    PACING_DZ,
    type PacingGrid,
    SOLID_SEALED,
} from './grid.js';
import { legalMask, type RouteRegion, regionsOf, viableCells } from './viable.js';

export const REACTION_S = 0.45;
export const FORK_MIN_ARM_U = REACTION_S * TRACK_CONTRACT.pacingCruise;
export const FORK_MIN_SEPARATION_U = MAX_SHIP_WIDTH;

export interface RouteNode {
    id: number;
    k0: number;
    k1: number;
    air: boolean;
    lo: number[];
    hi: number[];
    succ: number[];
    pred: number[];
}

export type ForkKind = 'fork' | 'dodge';

export interface RouteArm {
    nodes: number[];
    air: boolean;
}

export interface RouteFork {
    split: number;
    merge: number;
    k0: number;
    k1: number;
    length: number;
    separation: number;
    arms: RouteArm[];
    kind: ForkKind;
    mode: boolean;
}

export interface PacingRoutes {
    viable: Uint8Array;
    deadEnd: Uint8Array;
    corridors: Uint8Array;
    nodes: RouteNode[];
    forks: RouteFork[];
    conditional: RouteRegion[];
}

interface Run {
    a: number;
    b: number;
    air: boolean;
}

function rowRuns( grid: PacingGrid, viable: Uint8Array, k: number ): Run[] {
    const { cols, cells } = grid;
    const out: Run[] = [];
    let j = 0;
    while ( j < cols ) {
        if ( viable[ k * cols + j ] === 0 ) {
            j++;
            continue;
        }
        const air = cells[ k * cols + j ] === CELL_AIR;
        let e = j;
        while ( e < cols && viable[ k * cols + e ] === 1 && ( cells[ k * cols + e ] === CELL_AIR ) === air ) e++;
        out.push( { a: j, b: e - 1, air } );
        j = e;
    }
    return out;
}

function corridorCount( grid: PacingGrid, viable: Uint8Array, k: number ): number {
    const { cols } = grid;
    let n = 0;
    for ( let j = 0; j < cols; j++ ) {
        if ( viable[ k * cols + j ] === 1 && ( j === 0 || viable[ k * cols + j - 1 ] === 0 ) ) n++;
    }
    return n;
}

interface Open {
    run: Run;
    node: RouteNode;
}

function newNode( nodes: RouteNode[], k: number, run: Run ): RouteNode {
    const n = { id: nodes.length, k0: k, k1: k, air: run.air, lo: [ run.a ], hi: [ run.b ], succ: [], pred: [] };
    nodes.push( n );
    return n;
}

export function routeNodes( grid: PacingGrid, viable: Uint8Array, step: number ): RouteNode[] {
    const nodes: RouteNode[] = [];
    const links = ( p: Run, q: Run ): boolean => p.b + step >= q.a && q.b + step >= p.a;
    let open: Open[] = rowRuns( grid, viable, 0 ).map( ( run ) => ( { run, node: newNode( nodes, 0, run ) } ) );
    for ( let k = 1; k < grid.count; k++ ) {
        const row = rowRuns( grid, viable, k );
        const outDegree = open.map( ( o ) => row.filter( ( r ) => links( o.run, r ) ).length );
        open = row.map( ( run ) => {
            const preds = open.filter( ( o ) => links( o.run, run ) );
            const only = preds.length === 1 ? preds[ 0 ] : null;
            if ( only !== null && outDegree[ open.indexOf( only ) ] === 1 && only.node.air === run.air ) {
                only.node.k1 = k;
                only.node.lo.push( run.a );
                only.node.hi.push( run.b );
                return { run, node: only.node };
            }
            const node = newNode( nodes, k, run );
            for ( const p of preds ) {
                p.node.succ.push( node.id );
                node.pred.push( p.node.id );
            }
            return { run, node };
        } );
    }
    return nodes;
}

function postDominators( nodes: RouteNode[], lastRow: number ): Int32Array {
    const sink = nodes.length;
    const ipdom = new Int32Array( nodes.length + 1 ).fill( -1 );
    ipdom[ sink ] = sink;
    const meet = ( a: number, b: number ): number => {
        let x = a;
        let y = b;
        while ( x !== y ) {
            if ( x < y ) x = ipdom[ x ];
            else y = ipdom[ y ];
        }
        return x;
    };
    for ( let id = nodes.length - 1; id >= 0; id-- ) {
        const n = nodes[ id ];
        const outs = n.k1 === lastRow ? [ ...n.succ, sink ] : n.succ;
        let d = outs.length > 0 ? outs[ 0 ] : sink;
        for ( const s of outs.slice( 1 ) ) d = meet( d, s );
        ipdom[ id ] = d;
    }
    return ipdom;
}

function reachBefore( nodes: RouteNode[], from: number, stop: number ): Set< number > {
    const seen = new Set< number >();
    const stack = [ from ];
    while ( stack.length > 0 ) {
        const id = stack.pop() as number;
        if ( id >= stop || seen.has( id ) ) continue;
        seen.add( id );
        for ( const s of nodes[ id ].succ ) stack.push( s );
    }
    return seen;
}

function groupArms( nodes: RouteNode[], split: RouteNode, stop: number ): RouteArm[] {
    const groups: Set< number >[] = [];
    for ( const c of split.succ ) {
        let set = reachBefore( nodes, c, stop );
        for ( let g = groups.length - 1; g >= 0; g-- ) {
            if ( ! [ ...groups[ g ] ].some( ( id ) => set.has( id ) ) ) continue;
            set = new Set( [ ...set, ...groups[ g ] ] );
            groups.splice( g, 1 );
        }
        groups.push( set );
    }
    return groups.map( ( g ) => {
        const ids = [ ...g ].sort( ( a, b ) => a - b );
        return { nodes: ids, air: ids.some( ( id ) => nodes[ id ].air ) };
    } );
}

function armMid( nodes: RouteNode[], arm: RouteArm, k: number ): number | null {
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for ( const id of arm.nodes ) {
        const n = nodes[ id ];
        if ( k < n.k0 || k > n.k1 ) continue;
        lo = Math.min( lo, n.lo[ k - n.k0 ] );
        hi = Math.max( hi, n.hi[ k - n.k0 ] );
    }
    return lo === Number.POSITIVE_INFINITY ? null : ( lo + hi ) / 2;
}

function separation( nodes: RouteNode[], arms: RouteArm[], k0: number, k1: number ): number {
    let best = Number.POSITIVE_INFINITY;
    for ( let k = k0; k <= k1; k++ ) {
        const mids = arms.map( ( a ) => armMid( nodes, a, k ) ).filter( ( m ): m is number => m !== null );
        mids.sort( ( a, b ) => a - b );
        for ( let i = 1; i < mids.length; i++ ) best = Math.min( best, ( mids[ i ] - mids[ i - 1 ] ) * PACING_DX );
    }
    return best === Number.POSITIVE_INFINITY ? 0 : best;
}

export function routeForks( nodes: RouteNode[], count: number ): RouteFork[] {
    const ipdom = postDominators( nodes, count - 1 );
    const out: RouteFork[] = [];
    for ( const split of nodes ) {
        if ( split.succ.length < 2 ) continue;
        const m = ipdom[ split.id ];
        const merge = m < nodes.length ? m : -1;
        const arms = groupArms( nodes, split, merge < 0 ? nodes.length : merge );
        if ( arms.length < 2 ) continue;
        const k0 = split.k1 + 1;
        const k1 = merge < 0 ? count - 1 : nodes[ merge ].k0 - 1;
        const length = ( k1 - k0 + 1 ) * PACING_DZ;
        const sep = separation( nodes, arms, k0, k1 );
        const kind = length >= FORK_MIN_ARM_U && sep >= FORK_MIN_SEPARATION_U ? 'fork' : 'dodge';
        const mode = arms.some( ( a ) => a.air ) && arms.some( ( a ) => ! a.air );
        out.push( { split: split.id, merge, k0, k1, length, separation: sep, arms, kind, mode } );
    }
    return out;
}

function conditionalRegions( frozen: FrozenTrack, base: Uint8Array, airLimit: number, step: number ): RouteRegion[] {
    const grid = buildGrid( frozen, { ...CONTRACT_HULL, solid: SOLID_SEALED } );
    const [ viable ] = viableCells( grid, legalMask( grid, airLimit, step ), step );
    const extra = new Uint8Array( viable.length );
    for ( let i = 0; i < extra.length; i++ ) extra[ i ] = viable[ i ] & ( 1 - base[ i ] );
    return regionsOf( extra, grid );
}

export function analyzeRoutes(
    frozen: FrozenTrack,
    grid: PacingGrid,
    airLimit: number,
    step: number,
    startX = 0,
): PacingRoutes {
    const [ viable, deadEnd ] = viableCells( grid, legalMask( grid, airLimit, step ), step, startX );
    const corridors = new Uint8Array( grid.count );
    for ( let k = 0; k < grid.count; k++ ) corridors[ k ] = corridorCount( grid, viable, k );
    const nodes = routeNodes( grid, viable, step );
    return {
        viable,
        deadEnd,
        corridors,
        nodes,
        forks: routeForks( nodes, grid.count ),
        conditional: conditionalRegions( frozen, viable, airLimit, step ),
    };
}
