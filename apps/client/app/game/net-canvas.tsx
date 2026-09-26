import { Canvas } from '@react-three/fiber';
import {
    DROP_POWERUP_MESSAGE,
    type FireDir,
    resolveTrack,
    type TrackDescriptor,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { GameAudio } from '../audio/game-audio/game-audio';
import { RemoteEngineAudio } from '../audio/remote-engine-audio/remote-engine-audio';
import { TuningPanelMount } from '../dev/tuning-panel-mount';
import { attachRoomToWorld } from '../net/attach-room-to-world';
import { createPredictor } from '../net/prediction';
import { useRoom } from '../net/room-context/use-room';
import { Held, LocalPlayer } from './ecs/traits';
import { world } from './ecs/world';
import { FinishFade } from './finish/finish-fade';
import { lastInputSeq } from './input/current-input';
import { attachKeyboard } from './input/keyboard';
import { handlePowerKey } from './input/power-select';
import { NetHud } from './net-hud';
import { NetLoop } from './net-loop/net-loop';
import { CANVAS_GL } from './scene/canvas-gl';
import { MineField } from './scene/mine-field';
import { MineShock } from './scene/mine-shock';
import { PickupField } from './scene/pickup-field';
import { ProjectileField } from './scene/projectile-field';
import { RearView } from './scene/rear-view';
import { SeekerField } from './scene/seeker-field';
import { WorldScene } from './scene/world-scene';

export function NetCanvas( { descriptor }: { descriptor: TrackDescriptor } ) {
    const room = useRoom();
    const predictor = useMemo( createPredictor, [] );

    const track = useMemo( () => resolveTrack( descriptor ), [ descriptor ] );
    const trackRef = useRef( track );
    trackRef.current = track;

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard (1-3/Q/E/X) → Colyseus fire/drop messages.
    useEffect( () => {
        const actions = {
            rack: () => world.queryFirst( LocalPlayer, Held )?.get( Held )?.slots ?? [],
            fire: ( slot: number, dir: FireDir ) =>
                room.send( USE_POWERUP_MESSAGE, { slot, dir, seq: lastInputSeq() } ),
            drop: ( slot: number ) => room.send( DROP_POWERUP_MESSAGE, { slot } ),
        };
        const onKey = ( e: KeyboardEvent ) => handlePowerKey( e, actions );
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    // JUSTIFIED EFFECT — syncs with an external system: the Colyseus room (schema callbacks) → ECS, plus
    useEffect( () => attachRoomToWorld( room, world, predictor, trackRef ), [ room, predictor ] );

    return (
        <WorldProvider world={ world }>
            <div className="fixed inset-0">
                <Canvas gl={ CANVAS_GL } camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }>
                    <WorldScene track={ track }>
                        <NetLoop predictor={ predictor } track={ track } room={ room } />
                        <PickupField room={ room } track={ track } />
                        <ProjectileField />
                        <SeekerField />
                        <MineField />
                        <MineShock />
                        <RearView />
                        <GameAudio />
                        <RemoteEngineAudio />
                    </WorldScene>
                </Canvas>
            </div>
            <NetHud track={ track } />
            <FinishFade />
            <TuningPanelMount />
        </WorldProvider>
    );
}
