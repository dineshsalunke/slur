import type { RootState } from '@react-three/fiber';
import { copySimShip, createFixedStep, FIXED_DT, spawnShip, type Track } from '@slur/shared';
import type { World } from 'koota';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../../game/camera/chase';
import { hoverSystem } from '../../../game/ecs/hover';
import { syncRenderSystem } from '../../../game/ecs/systems';
import { LocalPlayer, Net, Prev, Sim } from '../../../game/ecs/traits';
import { deckFlightSystem } from '../deck-flight';
import { deckCommand, deckState, recording, stopTake } from '../take-recorder';

export interface DeckFrame {
    world: World;
    track: Track;
    advance: ( elapsedSeconds: number, step: ( dt: number ) => void ) => number;
    step: ( dt: number ) => void;
    now: number;
    alpha: number;
}

export function createDeckFrame( world: World, track: Track ): DeckFrame {
    const frame: DeckFrame = {
        world,
        track,
        advance: createFixedStep( FIXED_DT ),
        step: ( dt ) => deckFlightSystem( world, dt, track, frame.now ),
        now: 0,
        alpha: 0,
    };
    return frame;
}

export function restartDeckRun( world: World ): void {
    world.query( LocalPlayer, Sim, Prev ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip() );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

export function applyShipChoice( world: World ): void {
    const ship = world.queryFirst( LocalPlayer, Net );
    const cur = ship?.get( Net );
    const shipId = deckState().shipId;
    if ( ship && cur && cur.shipId !== shipId ) ship.set( Net, { ...cur, shipId } );
}

export function deckFinished( world: World ): boolean {
    return world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.finished ?? false;
}

export function deckShipChoice( f: DeckFrame ): void {
    applyShipChoice( f.world );
}

export function deckRestart( f: DeckFrame ): void {
    if ( ! deckCommand.restart ) return;
    deckCommand.restart = false;
    restartDeckRun( f.world );
}

export function deckFlight( f: DeckFrame, _state: RootState, delta: number ): void {
    f.now = performance.now();
    f.alpha = f.advance( delta, f.step );
}

export function deckTakeStop( f: DeckFrame ): void {
    if ( recording() && deckFinished( f.world ) ) void stopTake( 'finish' );
}

export function deckRenderInterp( f: DeckFrame, _state: RootState, delta: number ): void {
    syncRenderSystem( f.world, f.alpha, delta );
}

export function deckHover( f: DeckFrame, _state: RootState, delta: number ): void {
    hoverSystem( f.world, delta );
}

export function deckCamera( f: DeckFrame, state: RootState, delta: number ): void {
    updateChaseCamera( state.camera as PerspectiveCamera, f.world, delta );
}
