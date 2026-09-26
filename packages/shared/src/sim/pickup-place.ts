import { TRACK_CONTRACT } from '../constants.js';
import { intersectRuns, openRunsAtSlice, type Run } from './clearance.js';
import { hash2 } from './rng.js';
import { type Anchor, HALF_WIDTH, isHole, SEG_LEN, type Segment, START_SAFE, segIndexForZ } from './space.js';

export const PICKUP_GAP_MIN_SEGS = 6;
export const PICKUP_GAP_MAX_SEGS = 9;
export const PICKUP_ROW_SLIDE = 3;
export const PICKUP_RAIL_MARGIN = 8;
export const PICKUP_X_MAX = HALF_WIDTH - PICKUP_RAIL_MARGIN;
export const PICKUP_SWING_MAX = 40;
export const PICKUP_CLEAR = 2;
export const PICKUP_APPROACH = SEG_LEN;
export const PICKUP_SAMPLE_STEP = 1;

export const PICKUP_COLUMN_HALF = TRACK_CONTRACT.shipHalfW + PICKUP_CLEAR;
export const PICKUP_OVERRUN = TRACK_CONTRACT.shipHalfL + PICKUP_CLEAR;

const SALT_PICKUP_ID = 0x51c7e02b | 0;
const SALT_PICKUP_ROW = 0x2f6a91d3 | 0;
const SALT_PICKUP_X = 0x6b0e57a9 | 0;
const HASH_SCALE = 4294967296;

export function pickupSalt( seed: number ): string {
    return ( hash2( ( seed ^ SALT_PICKUP_ID ) | 0, 0 ) >>> 0 ).toString( 36 );
}

export function pickupId( ordinal: number, salt: string ): string {
    return `${ ordinal }.${ salt }`;
}

export function pickupOrdinal( id: string ): number {
    const dot = id.indexOf( '.' );
    const n = Number.parseInt( dot < 0 ? id : id.slice( 0, dot ), 10 );
    return Number.isFinite( n ) && n >= 0 ? n : 0;
}

export function pickupIdSalt( id: string ): string {
    const dot = id.indexOf( '.' );
    return dot < 0 ? '' : id.slice( dot + 1 );
}

export function rowZ( row: number ): number {
    return row * SEG_LEN + SEG_LEN / 2;
}

function unit( seed: number, salt: number, k: number ): number {
    return hash2( ( seed ^ salt ) | 0, k ) / HASH_SCALE;
}

export function pickupLanes( z: number, segmentAt: ( i: number ) => Segment ): Run[] {
    let common: Run[] = [ [ -PICKUP_X_MAX - PICKUP_COLUMN_HALF, PICKUP_X_MAX + PICKUP_COLUMN_HALF ] ];
    for ( let zz = z - PICKUP_APPROACH; zz <= z + PICKUP_OVERRUN && common.length > 0; zz += PICKUP_SAMPLE_STEP ) {
        common = intersectRuns( common, openRunsAtSlice( segmentAt( segIndexForZ( zz ) ), zz ) );
    }
    return common
        .map( ( [ a, b ] ): Run => [ a + PICKUP_COLUMN_HALF, b - PICKUP_COLUMN_HALF ] )
        .filter( ( [ a, b ] ) => b >= a );
}

export function pickupColumnClear( x: number, z: number, segmentAt: ( i: number ) => Segment ): boolean {
    return pickupLanes( z, segmentAt ).some( ( [ a, b ] ) => x >= a && x <= b );
}

function pickAlong( lanes: readonly Run[], lo: number, hi: number, u: number ): number | null {
    const clipped = lanes
        .map( ( [ a, b ] ): Run => [ Math.max( a, lo ), Math.min( b, hi ) ] )
        .filter( ( [ a, b ] ) => b >= a );
    if ( clipped.length === 0 ) return null;
    const total = clipped.reduce( ( s, [ a, b ] ) => s + ( b - a ), 0 );
    let at = u * total;
    for ( const [ a, b ] of clipped ) {
        if ( at <= b - a ) return a + at;
        at -= b - a;
    }
    return clipped[ clipped.length - 1 ][ 1 ];
}

interface Spot {
    row: number;
    x: number;
}

function findSpot(
    from: number,
    length: number,
    prevX: number,
    u: number,
    segmentAt: ( i: number ) => Segment,
): Spot | null {
    const rows: { row: number; lanes: Run[] }[] = [];
    for ( let row = from; row < length && row <= from + PICKUP_ROW_SLIDE; row++ ) {
        if ( ! isHole( segmentAt( row ) ) ) rows.push( { row, lanes: pickupLanes( rowZ( row ), segmentAt ) } );
    }
    for ( const { row, lanes } of rows ) {
        const x = pickAlong( lanes, prevX - PICKUP_SWING_MAX, prevX + PICKUP_SWING_MAX, u );
        if ( x !== null ) return { row, x };
    }
    for ( const { row, lanes } of rows ) {
        const x = pickAlong( lanes, -PICKUP_X_MAX, PICKUP_X_MAX, u );
        if ( x !== null ) return { row, x };
    }
    return null;
}

export function placePickups( seed: number, length: number, segmentAt: ( i: number ) => Segment ): Anchor[] {
    const salt = pickupSalt( seed );
    const out: Anchor[] = [];
    const span = PICKUP_GAP_MAX_SEGS - PICKUP_GAP_MIN_SEGS + 1;
    let prevX = 0;
    let seg = START_SAFE;
    for ( let k = 0; seg < length; k++ ) {
        const ordinal = out.length;
        const spot = findSpot( seg, length, prevX, unit( seed, SALT_PICKUP_X, ordinal ), segmentAt );
        const step = PICKUP_GAP_MIN_SEGS + Math.floor( unit( seed, SALT_PICKUP_ROW, k ) * span );
        if ( spot === null ) {
            seg += PICKUP_ROW_SLIDE + 1;
            continue;
        }
        out.push( { id: pickupId( ordinal, salt ), kind: 'pickup', x: spot.x, y: 0, z: rowZ( spot.row ) } );
        prevX = spot.x;
        seg = spot.row + step;
    }
    return out;
}
