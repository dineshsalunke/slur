import {
    type ArmReport,
    columnX,
    DEMAND_BIN_S,
    type ForkArms,
    measureDemand,
    PACING_DX,
    PACING_DZ,
    type PacingGrid,
    type PacingReport,
    type RouteNode,
    type RouteRegion,
    regionsOf,
} from '@slur/shared';
import { CHUNK_POINTS, type PlotPoint } from './board-scale';

export interface ShapeChunk {
    key: string;
    air: boolean;
    points: string;
}

export interface Series {
    k0: number;
    values: ArrayLike< number >;
}

export interface BinRange {
    lo: Float32Array;
    hi: Float32Array;
}

export type ForkVerdict = 'real' | 'dominated';

function formatPoint( [ x, y ]: PlotPoint ): string {
    return `${ x.toFixed( 3 ) },${ y.toFixed( 3 ) }`;
}

function rowTime( k: number, cruise: number ): number {
    return ( k * PACING_DZ ) / cruise;
}

export function forkLabel( i: number ): string {
    return `F${ i + 1 }`;
}

export function forkVerdict( fa: ForkArms ): ForkVerdict {
    return fa.arms.some( ( a ) => a.dominated ) ? 'dominated' : 'real';
}

export function offsetPoints( values: ArrayLike< number >, k0: number, cruise: number, stride = 1 ): PlotPoint[] {
    const out: PlotPoint[] = [];
    for ( let k = 0; k < values.length; k += stride ) out.push( [ rowTime( k0 + k + 0.5, cruise ), -values[ k ] ] );
    return out;
}

export function stepPoints( values: ArrayLike< number >, cruise: number ): PlotPoint[] {
    const out: PlotPoint[] = [];
    let a = 0;
    while ( a < values.length ) {
        let b = a;
        while ( b < values.length && values[ b ] === values[ a ] ) b++;
        out.push( [ rowTime( a, cruise ), -values[ a ] ], [ rowTime( b, cruise ), -values[ a ] ] );
        a = b;
    }
    return out;
}

export function binRange( series: Series[], count: number, binRows: number ): BinRange {
    const bins = Math.ceil( count / binRows );
    const lo = new Float32Array( bins ).fill( Number.POSITIVE_INFINITY );
    const hi = new Float32Array( bins ).fill( Number.NEGATIVE_INFINITY );
    for ( const s of series ) {
        for ( let i = 0; i < s.values.length; i++ ) {
            const k = s.k0 + i;
            if ( k < 0 || k >= count ) continue;
            const b = Math.floor( k / binRows );
            lo[ b ] = Math.min( lo[ b ], s.values[ i ] );
            hi[ b ] = Math.max( hi[ b ], s.values[ i ] );
        }
    }
    for ( let b = 0; b < bins; b++ ) {
        if ( lo[ b ] > hi[ b ] ) {
            lo[ b ] = 0;
            hi[ b ] = 0;
        }
    }
    return { lo, hi };
}

export function bandShapes( range: BinRange, binSeconds: number ): ShapeChunk[] {
    const out: ShapeChunk[] = [];
    for ( let a = 0; a < range.lo.length; a += CHUNK_POINTS ) {
        const b = Math.min( range.lo.length, a + CHUNK_POINTS );
        const top: PlotPoint[] = [];
        const bottom: PlotPoint[] = [];
        for ( let i = a; i < b; i++ ) {
            top.push( [ i * binSeconds, -range.hi[ i ] ], [ ( i + 1 ) * binSeconds, -range.hi[ i ] ] );
            bottom.push( [ i * binSeconds, -range.lo[ i ] ], [ ( i + 1 ) * binSeconds, -range.lo[ i ] ] );
        }
        out.push( {
            key: String( a ),
            air: false,
            points: [ ...top, ...bottom.reverse() ].map( formatPoint ).join( ' ' ),
        } );
    }
    return out;
}

export function nodeShapes( nodes: RouteNode[], grid: PacingGrid, cruise: number ): ShapeChunk[] {
    const half = PACING_DX / 2;
    const out: ShapeChunk[] = [];
    for ( const n of nodes ) {
        for ( let a = n.k0; a <= n.k1; a += CHUNK_POINTS ) {
            const b = Math.min( n.k1, a + CHUNK_POINTS - 1 );
            const top: PlotPoint[] = [];
            const bottom: PlotPoint[] = [];
            for ( let k = a; k <= b; k++ ) {
                const hi = -( columnX( n.hi[ k - n.k0 ], grid.hull ) + half );
                const lo = -( columnX( n.lo[ k - n.k0 ], grid.hull ) - half );
                top.push( [ rowTime( k, cruise ), hi ], [ rowTime( k + 1, cruise ), hi ] );
                bottom.push( [ rowTime( k, cruise ), lo ], [ rowTime( k + 1, cruise ), lo ] );
            }
            out.push( {
                key: `${ n.id }:${ a }`,
                air: n.air,
                points: [ ...top, ...bottom.reverse() ].map( formatPoint ).join( ' ' ),
            } );
        }
    }
    return out;
}

function cached< T >( map: WeakMap< object, T >, key: object, make: () => T ): T {
    const hit = map.get( key );
    if ( hit !== undefined ) return hit;
    const value = make();
    map.set( key, value );
    return value;
}

const armStrafeCache = new WeakMap< object, Float32Array >();
const nodeShapeCache = new WeakMap< object, ShapeChunk[] >();
const deadEndCache = new WeakMap< object, RouteRegion[] >();
const strafeBandCache = new WeakMap< object, ShapeChunk[] >();

export function armStrafe( arm: ArmReport, cruise: number ): Float32Array {
    return cached( armStrafeCache, arm, () => measureDemand( arm.path, cruise ).strafe );
}

export function viableShapes( report: PacingReport ): ShapeChunk[] {
    return cached( nodeShapeCache, report, () =>
        report.routes ? nodeShapes( report.routes.nodes, report.grid, report.cruise ) : [],
    );
}

export function deadEndRegions( report: PacingReport ): RouteRegion[] {
    return cached( deadEndCache, report, () =>
        report.routes ? regionsOf( report.routes.deadEnd, report.grid ) : [],
    );
}

export function strafeBand( report: PacingReport ): ShapeChunk[] {
    return cached( strafeBandCache, report, () => {
        const { arms, cruise, grid } = report;
        if ( ! arms ) return [];
        const series: Series[] = [
            { k0: 0, values: arms.easiest.demand.strafe },
            { k0: 0, values: arms.hardest.demand.strafe },
        ];
        for ( const fa of arms.forks ) {
            for ( const arm of fa.arms ) series.push( { k0: arm.k0, values: armStrafe( arm, cruise ) } );
        }
        const binRows = Math.max( 1, Math.round( ( cruise * DEMAND_BIN_S ) / PACING_DZ ) );
        return bandShapes( binRange( series, grid.count, binRows ), ( binRows * PACING_DZ ) / cruise );
    } );
}

export function pickedArm( report: PacingReport, fork: number, arm: number ): ArmReport | null {
    return report.arms?.forks[ fork ]?.arms[ arm ] ?? null;
}
