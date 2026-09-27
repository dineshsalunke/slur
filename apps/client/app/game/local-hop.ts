import type { PortalState } from '@slur/shared';
import { kickFov } from './camera/hop-kick';
import { burstPortalHop, type ShockSpot } from './scene/mine-shock-events';

export type LocalHopListener = () => void;

const listeners = new Set< LocalHopListener >();

export function onLocalHop( fn: LocalHopListener ): () => void {
    listeners.add( fn );
    return () => listeners.delete( fn );
}

export function hoppedAhead( before: number, after: number ): boolean {
    const ahead = ( after - before ) & 0xff;
    return ahead > 0 && ahead < 128;
}

export function noteLocalHops(
    before: number,
    after: number,
    from: ShockSpot,
    to: ShockSpot,
    portals: Iterable< PortalState >,
): void {
    if ( ! hoppedAhead( before, after ) ) return;
    kickFov();
    burstPortalHop( from, to, portals );
    for ( const fn of listeners ) fn();
}
