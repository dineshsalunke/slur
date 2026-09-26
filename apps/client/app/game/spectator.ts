import { PHASE } from '@slur/shared';

export const localRole = { spectating: false };

export const spectatorCam = { targetSessionId: null as string | null };

export const runPhase = { value: PHASE.lobby as number };

export interface SpectatorCandidate {
    z: number;
    spectating: boolean;
}

export function resolveSpectatorTarget( players: Iterable< readonly [ string, SpectatorCandidate ] > ): string | null {
    let leaderId: string | null = null;
    let leaderZ = Number.NEGATIVE_INFINITY;
    for ( const [ id, p ] of players ) {
        if ( p.spectating ) continue;
        if ( id === spectatorCam.targetSessionId ) return id;
        if ( p.z > leaderZ ) {
            leaderZ = p.z;
            leaderId = id;
        }
    }
    spectatorCam.targetSessionId = leaderId;
    return leaderId;
}

export function resetSpectatorTarget(): void {
    spectatorCam.targetSessionId = null;
}

export function cycleSpectatorTarget( racerIds: string[], dir: 1 | -1 = 1 ): void {
    if ( racerIds.length === 0 ) {
        spectatorCam.targetSessionId = null;
        return;
    }
    const i = racerIds.indexOf( spectatorCam.targetSessionId ?? '' );
    spectatorCam.targetSessionId = racerIds[ ( ( i < 0 ? -dir : i ) + dir + racerIds.length ) % racerIds.length ];
}
