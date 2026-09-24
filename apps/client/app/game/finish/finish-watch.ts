import type { World } from 'koota';
import { LocalPlayer, Sim } from '../ecs/traits';

export const CUT_DT = 1;

export interface WatchRacer {
    finished: boolean;
    spectating: boolean;
    connected: boolean;
    z: number;
}

export interface WatchField {
    forEach( visit: ( racer: WatchRacer, id: string ) => void ): void;
}

export interface FinishWatch {
    spent: boolean;
    cut: boolean;
    targetId: string | null;
}

export function createFinishWatch(): FinishWatch {
    return { spent: false, cut: false, targetId: null };
}

export const finishWatch = createFinishWatch();

export function resetFinishWatch( w: FinishWatch ): void {
    w.spent = false;
    w.cut = false;
    w.targetId = null;
}

export function localFinished( world: World ): boolean {
    return world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.finished ?? false;
}

function running( r: WatchRacer | null ): boolean {
    return r?.connected === true && ! r.spectating && ! r.finished;
}

const scan = {
    selfId: '',
    current: null as string | null,
    held: null as WatchRacer | null,
    leaderId: null as string | null,
    leaderZ: 0,
};

function visit( r: WatchRacer, id: string ): void {
    if ( id === scan.current ) scan.held = r;
    if ( id === scan.selfId || ! running( r ) || r.z <= scan.leaderZ ) return;
    scan.leaderZ = r.z;
    scan.leaderId = id;
}

export function pickWatchTarget( field: WatchField, selfId: string, current: string | null ): string | null {
    scan.selfId = selfId;
    scan.current = current;
    scan.held = null;
    scan.leaderId = null;
    scan.leaderZ = Number.NEGATIVE_INFINITY;
    field.forEach( visit );
    if ( running( scan.held ) ) return current;
    return scan.leaderId ?? current;
}
