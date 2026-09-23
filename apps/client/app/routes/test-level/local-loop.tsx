import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { attachFreezeToggle, simFreeze } from '../../dev/sim-freeze';
import { updateChaseCamera } from '../../game/camera/chase';
import { hoverSystem } from '../../game/ecs/hover';
import { localDeathVfxSystem } from '../../game/ecs/net-systems';
import { localFlightSystem, syncRenderSystem } from '../../game/ecs/systems';
import { localCombatSystem } from './local-combat';

export function LocalLoop( { track }: { track: Track } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    // JUSTIFIED EFFECT — syncs with an external system: the DOM keyboard (window keydown) that owns the freeze toggle.
    useEffect( attachFreezeToggle, [] );

    useFrame( ( state, delta ) => {
        if ( ! simFreeze.on ) {
            const alpha = advance( delta, ( dt ) => {
                localFlightSystem( world, dt, track );
                localCombatSystem( world, dt, track );
            } );
            syncRenderSystem( world, alpha );
            hoverSystem( world, delta );
            localDeathVfxSystem( world );
        }
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
