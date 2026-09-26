import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../../game/camera/chase';
import { hoverSystem } from '../../../game/ecs/hover';
import { syncRenderSystem } from '../../../game/ecs/systems';
import { useTrack } from '../../../game/track-context/use-track';
import { deckFlightSystem } from '../deck-flight';
import { deckCommand, recording, stopTake } from '../take-recorder';
import { applyShipChoice, deckFinished, restartDeckRun } from './deck-loop.utils';

export function DeckLoop() {
    const track = useTrack();
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    useFrame( ( state, delta ) => {
        applyShipChoice( world );
        if ( deckCommand.restart ) {
            deckCommand.restart = false;
            restartDeckRun( world );
        }
        const now = performance.now();
        const alpha = advance( delta, ( dt ) => deckFlightSystem( world, dt, track, now ) );
        if ( recording() && deckFinished( world ) ) void stopTake( 'finish' );
        syncRenderSystem( world, alpha, delta );
        hoverSystem( world, delta );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
