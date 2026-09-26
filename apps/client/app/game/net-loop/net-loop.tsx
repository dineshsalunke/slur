import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, PHASE } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { simFreeze } from '../../dev/sim-freeze';
import type { Predictor } from '../../net/prediction';
import type { RunRoomLike } from '../../net/run-room-like';
import { hoverSystem } from '../ecs/hover';
import { freezeLocalPrev, localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from '../ecs/net-systems';
import { syncRenderSystem } from '../ecs/systems';
import { localRole, runPhase } from '../spectator';
import { useTrack } from '../track-context/use-track';
import { stepFinishCurtain, updateNetCamera } from './net-loop.utils';

export function NetLoop( { predictor, room }: { predictor: Predictor; room: RunRoomLike } ) {
    const world = useWorld();
    const track = useTrack();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const phase = runPhase.value;
        let cut = false;
        if ( ! simFreeze.on ) {
            const racing = phase === PHASE.racing && ! localRole.spectating;
            const alpha = advance( delta, ( dt ) => {
                if ( racing ) netFlightSystem( world, dt, predictor, track );
            } );
            if ( ! racing ) freezeLocalPrev( world );
            syncRenderSystem( world, alpha, delta );
            remoteInterpSystem( world, delta );
            hoverSystem( world, delta );
            localDeathVfxSystem( world );
            cut = stepFinishCurtain( world, phase, delta );
        }
        updateNetCamera( state.camera as PerspectiveCamera, world, delta, room, phase, cut );
    } );
    return null;
}
