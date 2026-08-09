import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, type Track as TrackHandle } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import type { Predictor } from '../net/prediction';
import { updateChaseCamera } from './camera/chase';
import { localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from './ecs/net-systems';
import { syncRenderSystem } from './ecs/systems';

// The ONE networked loop: local predict (fixed-60, records pending) → interpolate local (prev→sim)
// → interpolate remotes (buffered snapshots) → chase camera. Default priority keeps R3F auto-render on.
export function NetLoop( { predictor, track }: { predictor: Predictor; track: TrackHandle } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const alpha = advance( delta, ( dt ) => netFlightSystem( world, dt, predictor, track ) );
        syncRenderSystem( world, alpha ); // local ship only (remotes have no Sim/Prev)
        remoteInterpSystem( world ); // remote ships (also hides derezzed remotes)
        localDeathVfxSystem( world ); // hide the local ship while derezzed
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );
    return null;
}
