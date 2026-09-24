import { useFrame } from '@react-three/fiber';
import { copySimShip, createFixedStep, FIXED_DT, spawnShip, type Track } from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { attachFreezeToggle, simFreeze } from '../../dev/sim-freeze';
import { updateChaseCamera } from '../../game/camera/chase';
import { hoverSystem } from '../../game/ecs/hover';
import { localDeathVfxSystem } from '../../game/ecs/net-systems';
import { localFlightSystem, syncRenderSystem } from '../../game/ecs/systems';
import { LocalPlayer, Prev, Sim } from '../../game/ecs/traits';
import { finishReset, showFinishFade, stepFinishReset } from '../../game/finish/finish-reset';
import { localCombatSystem, restartLocalCombat } from './local-combat';
import { restartRunClock } from './run-clock';

function localFinished( world: World ): boolean {
    return world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.finished ?? false;
}

function restartTestRun( world: World, track: Track ): void {
    world.query( LocalPlayer, Sim, Prev ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip() );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
    restartLocalCombat( world, track );
    restartRunClock();
}

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
            if ( stepFinishReset( finishReset, localFinished( world ), delta ) === 'reset' ) {
                restartTestRun( world, track );
            }
            syncRenderSystem( world, alpha );
            hoverSystem( world, delta );
            localDeathVfxSystem( world );
        }
        showFinishFade( finishReset );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
