import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from './camera/chase';
import { flightSystem, syncRenderSystem } from './ecs/systems';

// The ONE solo loop: fixed-60 physics (accumulator) → interpolate → camera. All at default priority so
// R3F's auto-render stays on (no manual gl.render). Root holds zero reactive subscriptions.
export function GameLoop() {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const alpha = advance( delta, ( dt ) => flightSystem( world, dt ) );
        syncRenderSystem( world, alpha );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );
    return null;
}
