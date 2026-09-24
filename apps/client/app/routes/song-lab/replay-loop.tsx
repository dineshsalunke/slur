import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo, useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../game/camera/chase';
import { hoverSystem } from '../../game/ecs/hover';
import { localDeathVfxSystem } from '../../game/ecs/net-systems';
import { syncRenderSystem } from '../../game/ecs/systems';
import { replay, replayView } from './replay-state';
import { replayFlightSystem, respawnReplayShip } from './replay-systems';

const MAX_STEPS = 16;

export function ReplayLoop( { track }: { track: Track } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT, MAX_STEPS ), [] );
    const seen = useRef( -1 );

    useFrame( ( state, delta ) => {
        if ( seen.current !== replay.generation ) {
            seen.current = replay.generation;
            respawnReplayShip( world );
        }
        const view = replayView.get();
        if ( view.playing ) {
            const alpha = advance( delta * view.speed, () => replayFlightSystem( world, track ) );
            syncRenderSystem( world, alpha );
            hoverSystem( world, delta );
            localDeathVfxSystem( world );
        }
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
