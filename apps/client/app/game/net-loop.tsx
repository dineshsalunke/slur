import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, PHASE, type Track as TrackHandle } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import type { Predictor } from '../net/prediction';
import { updateChaseCamera, updateLobbyCamera, updateSpectatorCamera } from './camera/chase';
import { freezeLocalPrev, localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from './ecs/net-systems';
import { syncRenderSystem } from './ecs/systems';
import { localRole, runPhase, spectatorCam } from './spectator';

export function NetLoop( { predictor, track }: { predictor: Predictor; track: TrackHandle } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const racing = runPhase.value === PHASE.racing && ! localRole.spectating;
        const alpha = advance( delta, ( dt ) => {
            if ( racing ) netFlightSystem( world, dt, predictor, track );
        } );
        if ( ! racing ) freezeLocalPrev( world );
        syncRenderSystem( world, alpha, delta );
        remoteInterpSystem( world, delta );
        localDeathVfxSystem( world );
        const cam = state.camera as PerspectiveCamera;
        if ( runPhase.value === PHASE.lobby ) updateLobbyCamera( cam, world, delta );
        else if ( localRole.spectating ) updateSpectatorCamera( cam, world, delta, spectatorCam.targetSessionId );
        else updateChaseCamera( cam, world, delta );
    } );
    return null;
}
