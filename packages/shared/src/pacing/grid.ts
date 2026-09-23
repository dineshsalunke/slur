import { MAX_SHIP_WIDTH, TRACK_CONTRACT } from '../constants.js';
import { openRunsAtSlice } from '../sim/clearance.js';
import { HALF_WIDTH, SEG_LEN, type Segment, segIndexForZ, spanHasZ, type Track } from '../sim/space.js';

export const PACING_DZ = 1;
export const PACING_DX = ( TRACK_CONTRACT.weaveStrafeClamp * PACING_DZ ) / TRACK_CONTRACT.pacingCruise / 2;
export const PACING_HULL = MAX_SHIP_WIDTH / 2;

export const CELL_BLOCKED = 0;
export const CELL_GROUND = 1;
export const CELL_AIR = 2;

export interface PacingGrid {
    count: number;
    cols: number;
    cells: Uint8Array;
    widest: Float32Array;
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

export function columnX( j: number ): number {
    return -HALF_WIDTH + PACING_HULL + j * PACING_DX;
}

export function columnCount(): number {
    return Math.floor( ( 2 * HALF_WIDTH - 2 * PACING_HULL ) / PACING_DX + 1e-9 ) + 1;
}

export function nearestColumn( x: number ): number {
    const j = Math.round( ( x + HALF_WIDTH - PACING_HULL ) / PACING_DX );
    return Math.min( Math.max( j, 0 ), columnCount() - 1 );
}

function blockedAt( seg: Segment, x: number, z: number ): boolean {
    return seg.blocks.some( ( b ) => b.z0 <= z && z < b.z1 && b.x0 < x + PACING_HULL && b.x1 > x - PACING_HULL );
}

function groundAt( seg: Segment, x: number, z: number ): boolean {
    return seg.floors.some( ( f ) => spanHasZ( seg, f, z ) && f.x0 <= x && x <= f.x1 );
}

function classifyRow( seg: Segment, z: number, cols: number, out: Uint8Array, base: number ): void {
    for ( let j = 0; j < cols; j++ ) {
        const x = columnX( j );
        if ( blockedAt( seg, x, z ) ) out[ base + j ] = CELL_BLOCKED;
        else out[ base + j ] = groundAt( seg, x, z ) ? CELL_GROUND : CELL_AIR;
    }
}

export function buildGrid( frozen: FrozenTrack ): PacingGrid {
    const count = Math.round( ( frozen.length * SEG_LEN ) / PACING_DZ );
    const cols = columnCount();
    const cells = new Uint8Array( count * cols );
    const widest = new Float32Array( count );
    for ( let k = 0; k < count; k++ ) {
        const z = sampleZ( k );
        const seg = frozen.segments[ segIndexForZ( z ) ];
        classifyRow( seg, z, cols, cells, k * cols );
        let best = 0;
        for ( const [ lo, hi ] of openRunsAtSlice( seg, z ) ) best = Math.max( best, hi - lo );
        widest[ k ] = best;
    }
    return { count, cols, cells, widest };
}
