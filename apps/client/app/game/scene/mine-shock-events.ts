import type { PortalState } from '@slur/shared';
import { createEventQueue } from './event-queue';

export type ShockKind = 'big' | 'small' | 'fizzle' | 'portalIn' | 'portalOut';

export interface ShockSpot {
    x: number;
    y: number;
    z: number;
}

export interface MineShock extends ShockSpot {
    kind: ShockKind;
}

const MAX_QUEUED = 16;
const queue = createEventQueue< MineShock >( MAX_QUEUED );

export function pushMineShock( e: MineShock ): void {
    queue.push( e );
}

export function drainMineShocks( sink: ( e: MineShock ) => void ): void {
    queue.drain( sink );
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
