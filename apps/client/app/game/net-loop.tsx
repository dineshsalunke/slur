import type { Room } from '@colyseus/sdk';
import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, PHASE, type RunState, type Track as TrackHandle } from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import type { Predictor } from '../net/prediction';
import { updateChaseCamera, updateLobbyCamera, updateSpectatorCamera } from './camera/chase';
import { hoverSystem } from './ecs/hover';
import { freezeLocalPrev, localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from './ecs/net-systems';
import { syncRenderSystem } from './ecs/systems';
import { finishReset, showFinishFade, stepFinishReset } from './finish/finish-reset';
import { CUT_DT, finishWatch, localFinished, pickWatchTarget, resetFinishWatch } from './finish/finish-watch';
import { localRole, resetSpectatorTarget, resolveSpectatorTarget, runPhase } from './spectator';

function stepFinishCurtain( world: World, phase: number, delta: number ): boolean {
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

function updateFinishCamera( cam: PerspectiveCamera, world: World, dt: number, room: Room< RunState > ): void {
    finishWatch.targetId = pickWatchTarget( room.state.players, room.sessionId, finishWatch.targetId );
    if ( finishWatch.targetId ) updateSpectatorCamera( cam, world, dt, finishWatch.targetId );
    else updateLobbyCamera( cam, world, dt );
}

export function NetLoop( {
    predictor,
    track,
    room,
}: {
    predictor: Predictor;
    track: TrackHandle;
    room: Room< RunState >;
} ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const phase = runPhase.value;
        const racing = phase === PHASE.racing && ! localRole.spectating;
        const alpha = advance( delta, ( dt ) => {
            if ( racing ) netFlightSystem( world, dt, predictor, track );
        } );
        if ( ! racing ) freezeLocalPrev( world );
        syncRenderSystem( world, alpha, delta );
        remoteInterpSystem( world, delta );
        hoverSystem( world, delta );
        localDeathVfxSystem( world );
        const cut = stepFinishCurtain( world, phase, delta );

        const cam = state.camera as PerspectiveCamera;
        if ( phase === PHASE.lobby ) {
            resetSpectatorTarget();
            updateLobbyCamera( cam, world, delta );
        } else if ( localRole.spectating )
            updateSpectatorCamera( cam, world, delta, resolveSpectatorTarget( room.state.players ) );
        else if ( finishWatch.cut ) updateFinishCamera( cam, world, cut ? CUT_DT : delta, room );
        else updateChaseCamera( cam, world, delta );
    } );
    return null;
}
