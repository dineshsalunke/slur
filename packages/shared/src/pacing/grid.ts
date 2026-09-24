import { type FlightTuning, MAX_SHIP_WIDTH, TRACK_CONTRACT } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { openRunsAtSlice } from '../sim/clearance.js';
import {
    type BlockKind,
    HALF_WIDTH,
    SEG_LEN,
    type Segment,
    segIndexForZ,
    spanHasZ,
    spanOverlapsZ,
    type Track,
} from '../sim/space.js';

export const PACING_DZ = 1;
export const PACING_DX = ( TRACK_CONTRACT.weaveStrafeClamp * PACING_DZ ) / TRACK_CONTRACT.pacingCruise / 2;
export const PACING_HULL = MAX_SHIP_WIDTH / 2;

export const CELL_BLOCKED = 0;
export const CELL_GROUND = 1;
export const CELL_AIR = 2;

export interface PacingHull {
    halfW: number;
    halfL: number;
    footW: number;
    footL: number;
    solid: readonly BlockKind[];
}

export const SOLID_ALL: readonly BlockKind[] = [ 'sealed', 'fractured' ];
export const SOLID_SEALED: readonly BlockKind[] = [ 'sealed' ];

export const PACING_HULL_L = SHIP_CLASSES.freighter.tuning.halfL;

export const CONTRACT_HULL: PacingHull = {
    halfW: PACING_HULL,
    halfL: PACING_HULL_L,
    footW: 0,
    footL: 0,
    solid: SOLID_ALL,
};

export function classHull( t: FlightTuning, slot = 0 ): PacingHull {
    return { halfW: t.halfW, halfL: t.halfL + slot / 2, footW: t.halfW, footL: t.halfL, solid: SOLID_ALL };
}

export interface PacingGrid {
    count: number;
    cols: number;
    cells: Uint8Array;
    widest: Float32Array;
    hull: PacingHull;
}

export interface FrozenTrack {
    track: Track;
    segments: Segment[];
    length: number;
}

export function freezeTrack( source: Track ): FrozenTrack {
    const length = Math.round( source.finishZ / SEG_LEN );
    const segments: Segment[] = [];
    for ( let i = 0; i < length; i++ ) segments.push( source.segmentAt( i ) );
    const extra = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        if ( i >= 0 && i < length ) return segments[ i ];
        let s = extra.get( i );
        if ( s === undefined ) {
            s = source.segmentAt( i );
            extra.set( i, s );
        }
        return s;
    };
    const track: Track = {
        finishZ: source.finishZ,
        anchors: source.anchors,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
    };
    return { track, segments, length };
}

export function sampleZ( k: number ): number {
    return ( k + 0.5 ) * PACING_DZ;
}

export function columnX( j: number, hull: PacingHull = CONTRACT_HULL ): number {
    return -HALF_WIDTH + hull.halfW + j * PACING_DX;
}

export function columnCount( hull: PacingHull = CONTRACT_HULL ): number {
    return Math.floor( ( 2 * HALF_WIDTH - 2 * hull.halfW ) / PACING_DX + 1e-9 ) + 1;
}

export function nearestColumn( x: number, hull: PacingHull = CONTRACT_HULL ): number {
    const j = Math.round( ( x + HALF_WIDTH - hull.halfW ) / PACING_DX );
    return Math.min( Math.max( j, 0 ), columnCount( hull ) - 1 );
}

function blockedAt( segs: Segment[], hull: PacingHull, x: number, z: number ): boolean {
    return segs.some( ( seg ) =>
        seg.blocks.some(
            ( b ) =>
                hull.solid.includes( b.kind ) &&
                b.z0 - hull.halfL <= z &&
                z < b.z1 + hull.halfL &&
                b.x0 < x + hull.halfW &&
                b.x1 > x - hull.halfW,
        ),
    );
}

function floorTouches( seg: Segment, hull: PacingHull, x: number, z: number ): boolean {
    return seg.floors.some( ( f ) => {
        const inZ = hull.footL === 0 ? spanHasZ( seg, f, z ) : spanOverlapsZ( seg, f, z - hull.footL, z + hull.footL );
        return inZ && f.x0 <= x + hull.footW && x - hull.footW <= f.x1;
    } );
}

function groundAt( segs: Segment[], hull: PacingHull, x: number, z: number ): boolean {
    return segs.some( ( seg ) => floorTouches( seg, hull, x, z ) );
}

function rowSegments( frozen: FrozenTrack, hull: PacingHull, z: number ): Segment[] {
    const reach = Math.max( hull.halfL, hull.footL );
    const out: Segment[] = [];
    for ( let i = segIndexForZ( z - reach ); i <= segIndexForZ( z + reach ); i++ )
        out.push( frozen.track.segmentAt( i ) );
    return out;
}

function classifyRow(
    segs: Segment[],
    hull: PacingHull,
    z: number,
    cols: number,
    out: Uint8Array,
    base: number,
): void {
    for ( let j = 0; j < cols; j++ ) {
        const x = columnX( j, hull );
        if ( blockedAt( segs, hull, x, z ) ) out[ base + j ] = CELL_BLOCKED;
        else out[ base + j ] = groundAt( segs, hull, x, z ) ? CELL_GROUND : CELL_AIR;
    }
}

export function buildGrid( frozen: FrozenTrack, hull: PacingHull = CONTRACT_HULL ): PacingGrid {
    const count = Math.round( ( frozen.length * SEG_LEN ) / PACING_DZ );
    const cols = columnCount( hull );
    const cells = new Uint8Array( count * cols );
    const widest = new Float32Array( count );
    for ( let k = 0; k < count; k++ ) {
        const z = sampleZ( k );
        classifyRow( rowSegments( frozen, hull, z ), hull, z, cols, cells, k * cols );
        let best = 0;
        for ( const [ lo, hi ] of openRunsAtSlice( frozen.segments[ segIndexForZ( z ) ], z ) )
            best = Math.max( best, hi - lo );
        widest[ k ] = best;
    }
    return { count, cols, cells, widest, hull };
}
