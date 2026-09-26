import type { Room } from '@colyseus/sdk';
import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, PHASE, type RunState } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import type { Predictor } from '../../net/prediction';
import { updateChaseCamera, updateLobbyCamera, updateSpectatorCamera } from '../camera/chase';
import { hoverSystem } from '../ecs/hover';
import { freezeLocalPrev, localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from '../ecs/net-systems';
import { syncRenderSystem } from '../ecs/systems';
import { CUT_DT, finishWatch } from '../finish/finish-watch';
import { localRole, resetSpectatorTarget, resolveSpectatorTarget, runPhase } from '../spectator';
import { useTrack } from '../track-context/use-track';
import { stepFinishCurtain, updateFinishCamera } from './net-loop.utils';

export function NetLoop( { predictor, room }: { predictor: Predictor; room: Room< RunState > } ) {
    const world = useWorld();
    const track = useTrack();
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
