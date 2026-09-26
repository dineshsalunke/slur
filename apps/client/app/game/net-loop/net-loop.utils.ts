import type { Room } from '@colyseus/sdk';
import { PHASE, type RunState } from '@slur/shared';
import type { World } from 'koota';
import type { PerspectiveCamera } from 'three';
import { updateLobbyCamera, updateSpectatorCamera } from '../camera/chase';
import { finishReset, showFinishFade, stepFinishReset } from '../finish/finish-reset';
import { finishWatch, localFinished, pickWatchTarget, resetFinishWatch } from '../finish/finish-watch';
import { localRole } from '../spectator';

export function stepFinishCurtain( world: World, phase: number, delta: number ): boolean {
    if ( phase === PHASE.lobby || phase === PHASE.countdown ) resetFinishWatch( finishWatch );
    const ending =
        ! finishWatch.spent && ! localRole.spectating && ( phase === PHASE.finished || localFinished( world ) );
    const cut = stepFinishReset( finishReset, ending, delta ) === 'reset';
    if ( cut ) {
        finishWatch.spent = true;
        finishWatch.cut = true;
    }
    showFinishFade( finishReset );
    return cut;
}

export function updateFinishCamera( cam: PerspectiveCamera, world: World, dt: number, room: Room< RunState > ): void {
    finishWatch.targetId = pickWatchTarget( room.state.players, room.sessionId, finishWatch.targetId );
    if ( finishWatch.targetId ) updateSpectatorCamera( cam, world, dt, finishWatch.targetId );
    else updateLobbyCamera( cam, world, dt );
}
