import { Canvas, useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT } from '@slur/shared';
import { useWorld, WorldProvider } from 'koota/react';
import { useEffect, useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from './camera/chase';
import { flightSystem, syncRenderSystem } from './ecs/systems';
import { LocalPlayer, Prev, Render, Sim } from './ecs/traits';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { Scenery } from './scene/scenery';
import { Ships } from './scene/ship';
import { Track } from './scene/track';

// The ONE loop: fixed-60 physics (accumulator) → interpolate → camera. All at default priority so
// R3F's auto-render stays on (no manual gl.render). Root holds zero reactive subscriptions.
function Loop() {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const alpha = advance( delta, ( dt ) => flightSystem( world, dt ) );
        syncRenderSystem( world, alpha );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );
    return null;
}

export function GameCanvas() {
    useEffect( attachKeyboard, [] );
    useEffect( () => {
        const ship = world.spawn( Sim, Prev, Render, LocalPlayer );
        return () => ship.destroy();
    }, [] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <color attach="background" args={ [ '#05060a' ] } />
                <ambientLight intensity={ 0.5 } />
                <Loop />
                <Track />
                <Scenery count={ 50 } />
                <Ships />
            </Canvas>
        </WorldProvider>
    );
}
