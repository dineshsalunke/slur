import type { MineEvent, PortalState } from '@slur/shared';
import { pushHit } from './hit-events';

export type ShockKind = 'big' | 'small' | 'fizzle' | 'portalIn' | 'portalOut';

export interface ShockSpot {
    x: number;
    y: number;
    z: number;
}

export interface MineShock extends ShockSpot {
    kind: ShockKind;
}

const queue: MineShock[] = [];
const MAX_QUEUED = 16;
const SPARK_LIFT = 0.5;

export function pushMineShock( e: MineShock ): void {
    queue.push( e );
    if ( queue.length > MAX_QUEUED ) queue.shift();
}

export function drainMineShocks( sink: ( e: MineShock ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}

function kindOf( e: MineEvent ): ShockKind {
    if ( e.outcome === 'trigger' ) return 'big';
    return e.outcome === 'fizzle' ? 'fizzle' : 'small';
}

export function burstMine( e: MineEvent ): void {
    pushMineShock( { x: e.x, y: e.y, z: e.z, kind: kindOf( e ) } );
    if ( e.outcome === 'cleared' || e.outcome === 'fizzle' ) pushHit( { x: e.x, y: e.y + SPARK_LIFT, z: e.z } );
}

export function nearestPortalEnd( portals: Iterable< PortalState >, at: ShockSpot ): ShockSpot | null {
    let best: ShockSpot | null = null;
    let bestD = Infinity;
    const consider = ( x: number, y: number, z: number ) => {
        const d = Math.hypot( x - at.x, z - at.z );
        if ( d < bestD ) {
            bestD = d;
            best = { x, y, z };
        }
    };
    for ( const p of portals ) {
        if ( p.ends < 2 ) continue;
        consider( p.ax, p.ay, p.az );
        consider( p.bx, p.by, p.bz );
    }
    return best;
}

export function burstPortalHop( from: ShockSpot, to: ShockSpot, portals: Iterable< PortalState > ): void {
    const list = [ ...portals ];
    const entry = nearestPortalEnd( list, from ) ?? from;
    const exit = nearestPortalEnd( list, to ) ?? to;
    pushMineShock( { ...entry, kind: 'portalIn' } );
    pushMineShock( { ...exit, kind: 'portalOut' } );
}
