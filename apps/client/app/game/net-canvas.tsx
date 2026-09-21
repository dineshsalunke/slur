import { Canvas } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { resolveTrack, SET_CLASS_MESSAGE, SHIP_ORDER, type TrackDescriptor, USE_POWERUP_MESSAGE } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { GameAudio } from '../audio/game-audio';
import { RemoteEngineAudio } from '../audio/remote-engine-audio';
import { DebugPanel } from '../dev/debug-panel';
import { TunedBloom } from '../dev/tuned-bloom';
import { attachRoomToWorld } from '../net/attach-room-to-world';
import { createPredictor } from '../net/prediction';
import { useRoom } from '../net/room-context';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { NetDebugHud } from './net-debug-hud';
import { NetLoop } from './net-loop';
import { GRID_VOID } from './scene/env-config';
import { Environment } from './scene/environment';
import { ExplosionField } from './scene/explosions';
import { FinishGate } from './scene/finish-gate';
import { HitSpark } from './scene/hit-spark';
import { SceneLighting } from './scene/lighting';
import { PickupField } from './scene/pickup-field';
import { ProjectileField } from './scene/projectile-field';
import { Ships } from './scene/ship';
import { TrackView } from './scene/track-view';

export function NetCanvas( { descriptor }: { descriptor: TrackDescriptor } ) {
    const room = useRoom();
    const predictor = useMemo( createPredictor, [] );

    const track = useMemo( () => resolveTrack( descriptor ), [ descriptor ] );
    const wallSeed = descriptor.kind === 'procgen' ? descriptor.seed : undefined;
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
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <Environment config={ GRID_VOID } seed={ wallSeed } />
                <SceneLighting />
                <NetLoop predictor={ predictor } track={ track } />
                <ExplosionField />
                <HitSpark />
                <TrackView track={ track } />
                <FinishGate track={ track } />
                <PickupField room={ room } track={ track } />
                <ProjectileField />
                <Ships />
                <GameAudio />
                <RemoteEngineAudio />
                <EffectComposer multisampling={ 0 }>
                    <TunedBloom config={ GRID_VOID.bloom } />
                </EffectComposer>
            </Canvas>
            { import.meta.env.DEV && <NetDebugHud track={ track } /> }
            { import.meta.env.DEV && <DebugPanel /> }
        </WorldProvider>
    );
}
