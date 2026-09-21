import { PHASE } from '@slur/shared';

export const localRole = { spectating: false };

export const spectatorCam = { targetSessionId: null as string | null };

export const runPhase = { value: PHASE.lobby as number };

export function cycleSpectatorTarget( racerIds: string[], dir: 1 | -1 = 1 ): void {
    if ( racerIds.length === 0 ) {
        spectatorCam.targetSessionId = null;
        return;
    }
    const i = racerIds.indexOf( spectatorCam.targetSessionId ?? '' );
    spectatorCam.targetSessionId = racerIds[ ( ( i < 0 ? -dir : i ) + dir + racerIds.length ) % racerIds.length ];
}
