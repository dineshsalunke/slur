import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { attachFreezeToggle, simFreeze } from '../../../dev/sim-freeze';
import { updateChaseCamera } from '../../../game/camera/chase';
import { hoverSystem } from '../../../game/ecs/hover';
import { localDeathVfxSystem } from '../../../game/ecs/net-systems';
import { localFlightSystem, syncRenderSystem } from '../../../game/ecs/systems';
import { finishReset, showFinishFade, stepFinishReset } from '../../../game/finish/finish-reset';
import { useTrack } from '../../../game/track-context/use-track';
import { localCombatSystem } from '../local-combat';
import { localFinished, restartTestRun } from './local-loop.utils';

export function LocalLoop() {
    const world = useWorld();
    const track = useTrack();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    // Syncs with the browser keyboard: window keydown owns the sim freeze toggle.
    useEffect( attachFreezeToggle, [] );

    useFrame( ( state, delta ) => {
        if ( ! simFreeze.on ) {
            const alpha = advance( delta, ( dt ) => {
                localFlightSystem( world, dt, track );
                localCombatSystem( world, dt, track );
            } );
            if ( stepFinishReset( finishReset, localFinished( world ), delta ) === 'reset' ) {
                restartTestRun( world, track );
            }
            syncRenderSystem( world, alpha, delta );
            hoverSystem( world, delta );
            localDeathVfxSystem( world );
        }
        showFinishFade( finishReset );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
