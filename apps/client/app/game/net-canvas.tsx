import { Canvas } from '@react-three/fiber';
import { resolveTrack, SET_CLASS_MESSAGE, SHIP_ORDER, type TrackDescriptor, USE_POWERUP_MESSAGE } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { GameAudio } from '../audio/game-audio';
import { RemoteEngineAudio } from '../audio/remote-engine-audio';
import { attachRoomToWorld } from '../net/attach-room-to-world';
import { createPredictor } from '../net/prediction';
import { useRoom } from '../net/room-context';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { NetDebugHud } from './net-debug-hud';
import { NetLoop } from './net-loop';
import { PickupField } from './scene/pickup-field';
import { ProjectileField } from './scene/projectile-field';
import { WorldScene } from './scene/world-scene';

export function NetCanvas( { descriptor }: { descriptor: TrackDescriptor } ) {
    const room = useRoom();
    const predictor = useMemo( createPredictor, [] );

    const track = useMemo( () => resolveTrack( descriptor ), [ descriptor ] );
    const trackRef = useRef( track );
    trackRef.current = track;

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → a Colyseus message. Dev class
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            const n = Number( e.key );
            if ( n >= 1 && n <= SHIP_ORDER.length ) room.send( SET_CLASS_MESSAGE, SHIP_ORDER[ n - 1 ] );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard (E) → a discrete Colyseus fire message.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code === 'KeyE' && ! e.repeat ) room.send( USE_POWERUP_MESSAGE );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    // JUSTIFIED EFFECT — syncs with an external system: the Colyseus room (schema callbacks) → ECS, plus
    useEffect( () => attachRoomToWorld( room, world, predictor, trackRef ), [ room, predictor ] );

    return (
        <WorldProvider world={ world }>
            <Canvas
                flat
                style={ { position: 'fixed', inset: 0 } }
                camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
            >
                <WorldScene track={ track }>
                    <NetLoop predictor={ predictor } track={ track } />
                    <PickupField room={ room } track={ track } />
                    <ProjectileField />
                    <GameAudio />
                    <RemoteEngineAudio />
                </WorldScene>
            </Canvas>
            { import.meta.env.DEV && <NetDebugHud track={ track } /> }
        </WorldProvider>
    );
}
