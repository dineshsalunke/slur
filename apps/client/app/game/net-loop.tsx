import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, PHASE, type Track as TrackHandle } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import type { Predictor } from '../net/prediction';
import { updateChaseCamera, updateLobbyCamera, updateSpectatorCamera } from './camera/chase';
import { localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from './ecs/net-systems';
import { syncRenderSystem } from './ecs/systems';
import { localRole, runPhase, spectatorCam } from './spectator';

// The ONE networked loop: local predict (fixed-60, records pending) → interpolate local (prev→sim)
// → interpolate remotes (buffered snapshots) → pick a camera mode. Default priority keeps R3F auto-render on.
// The phase/role SEAMS (runPhase, localRole, spectatorCam) are module singletons the loop READS each frame —
// never props/React state (acceptance gate #3), so overlay re-renders never reach this WebGL loop.
export function NetLoop( { predictor, track }: { predictor: Predictor; track: TrackHandle } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        // Predict ONLY while actually racing (and not spectating) — frozen otherwise, matching the server,
        // which integrates ships ONLY in `racing`. Lobby/countdown/finished ships hold their pose.
        const alpha = advance( delta, ( dt ) => {
            if ( runPhase.value === PHASE.racing && ! localRole.spectating ) {
                netFlightSystem( world, dt, predictor, track );
            }
        } );
        syncRenderSystem( world, alpha ); // local ship only (remotes have no Sim/Prev)
        remoteInterpSystem( world ); // remote ships (also hides derezzed remotes)
        localDeathVfxSystem( world ); // hide the local ship while derezzed or spectating
        const cam = state.camera as PerspectiveCamera;
        if ( runPhase.value === PHASE.lobby ) updateLobbyCamera( cam, world, delta );
        else if ( localRole.spectating ) updateSpectatorCamera( cam, world, delta, spectatorCam.targetSessionId );
        else updateChaseCamera( cam, world, delta );
    } );
    return null;
}
