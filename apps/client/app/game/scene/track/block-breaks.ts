import type { Block } from '@slur/shared';

export const BREAK_BOLT = 0;
export const BREAK_SMASH = 1;

const QUEUE_LIMIT = 16;
const BOLT_LIMIT = 64;
const SMASH_REACH_BACK = 6;
const SMASH_REACH_SIDE = 2;

export interface BreakEvent {
    block: Block;
    x: number;
    y: number;
    z: number;
    kind: number;
    vz: number;
}

export interface ShipProbe {
    x: number;
    y: number;
    z: number;
    vz: number;
}

let standing = new Set< number >();
let nextStanding = new Set< number >();
const animating = new Set< number >();
const breaks: BreakEvent[] = [];
const mends: number[] = [];
const bolts = new Float32Array( BOLT_LIMIT * 3 );
let boltCount = 0;
let boltFrame = 0;

export function noteBolt( x: number, y: number, z: number ): void {
    if ( boltFrame !== 0 ) {
        boltCount = 0;
        boltFrame = 0;
    }
    if ( boltCount >= BOLT_LIMIT ) return;
    bolts[ boltCount * 3 ] = x;
    bolts[ boltCount * 3 + 1 ] = y;
    bolts[ boltCount * 3 + 2 ] = z;
    boltCount++;
}

export function boltCloseness( b: Block, reach: number ): number {
    let best = 0;
    for ( let i = 0; i < boltCount; i++ ) {
        const x = bolts[ i * 3 ];
        const z = bolts[ i * 3 + 2 ];
        if ( x < b.x0 - 1 || x > b.x1 + 1 ) continue;
        const gap = b.z0 - z;
        if ( gap < -1 || gap > reach ) continue;
        best = Math.max( best, 1 - Math.max( 0, gap ) / reach );
    }
    return best;
}

function smashedBy( b: Block, ship: ShipProbe | undefined ): boolean {
    if ( ! ship ) return false;
    return (
        ship.x > b.x0 - SMASH_REACH_SIDE &&
        ship.x < b.x1 + SMASH_REACH_SIDE &&
        ship.z > b.z0 - SMASH_REACH_BACK &&
        ship.z < b.z1 + SMASH_REACH_SIDE
    );
}

export function noteStanding( b: Block ): void {
    nextStanding.add( b.id );
    if ( animating.delete( b.id ) ) mends.push( b.id );
}

export function noteBroken( b: Block, ship: ShipProbe | undefined ): void {
    if ( ! standing.has( b.id ) || breaks.length >= QUEUE_LIMIT ) return;
    const smash = smashedBy( b, ship );
    const x = smash && ship ? Math.min( b.x1, Math.max( b.x0, ship.x ) ) : ( b.x0 + b.x1 ) / 2;
    const y = smash && ship ? Math.min( b.y1, Math.max( b.y0, ship.y ) ) : ( b.y0 + b.y1 ) / 2;
    breaks.push( { block: b, x, y, z: b.z0, kind: smash ? BREAK_SMASH : BREAK_BOLT, vz: smash && ship ? ship.vz : 0 } );
    animating.add( b.id );
}

export function endFrame(): void {
    const last = standing;
    standing = nextStanding;
    nextStanding = last;
    nextStanding.clear();
    if ( boltFrame === 1 ) boltCount = 0;
    boltFrame = 1;
}

export function settled( id: number ): void {
    animating.delete( id );
}

export function drainBreaks( sink: ( e: BreakEvent ) => void ): void {
    for ( const e of breaks ) sink( e );
    breaks.length = 0;
}

export function drainMends( sink: ( id: number ) => void ): void {
    for ( const id of mends ) sink( id );
    mends.length = 0;
}
