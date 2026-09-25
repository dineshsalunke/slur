import { useFrame } from '@react-three/fiber';
import { copySimShip, createFixedStep, FIXED_DT, spawnShip, type Track } from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../game/camera/chase';
import { hoverSystem } from '../../game/ecs/hover';
import { syncRenderSystem } from '../../game/ecs/systems';
import { LocalPlayer, Net, Prev, Sim } from '../../game/ecs/traits';
import { deckFlightSystem } from './deck-flight';
import { deckCommand, deckState, recording, stopTake } from './take-recorder';

function restartDeckRun( world: World ): void {
    world.query( LocalPlayer, Sim, Prev ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip() );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

function applyShipChoice( world: World ): void {
    const ship = world.queryFirst( LocalPlayer, Net );
    const cur = ship?.get( Net );
    const shipId = deckState().shipId;
    if ( ship && cur && cur.shipId !== shipId ) ship.set( Net, { ...cur, shipId } );
}

function deckFinished( world: World ): boolean {
    return world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.finished ?? false;
}

export function DeckLoop( { track }: { track: Track } ) {
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
