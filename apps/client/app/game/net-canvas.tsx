import { Canvas } from '@react-three/fiber';
import {
    DROP_POWERUP_MESSAGE,
    type FireDir,
    resolveTrack,
    type TrackDescriptor,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
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
import { MineShock } from './scene/mine-shock/mine-shock';
import { PickupField } from './scene/pickup-field';
import { ProjectileField } from './scene/projectile-field/projectile-field';
import { RearView } from './scene/rear-view';
import { SeekerField } from './scene/seeker-field';
import { TugLine } from './scene/tug-line/tug-line';
import { WorldScene } from './scene/world-scene';
import { TrackContext } from './track-context/track-context.constants';

export function NetCanvas( { descriptor, children }: { descriptor: TrackDescriptor; children?: ReactNode } ) {
    const room = useRoom();
    const predictor = useMemo( createPredictor, [] );

    const track = useMemo( () => resolveTrack( descriptor ), [ descriptor ] );
    const trackRef = useRef( track );
    trackRef.current = track;

    // Syncs with the browser keyboard: window keydown and keyup drive the local input.
    useEffect( attachKeyboard, [] );

    // Syncs with the browser keyboard: 1-3, Q, E and X send fire and drop messages to the Colyseus room.
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

    // Syncs the Colyseus room into the koota world: schema callbacks feed the entities and the predictor.
    useEffect( () => attachRoomToWorld( room, world, predictor, trackRef ), [ room, predictor ] );

    return (
        <WorldProvider world={ world }>
            <TrackContext value={ track }>
                <div className="fixed inset-0">
                    <Canvas gl={ CANVAS_GL } camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }>
                        <WorldScene>
                            <NetLoop predictor={ predictor } room={ room } />
                            <PickupField />
                            <ProjectileField />
                            <SeekerField />
                            <MineField />
                            <MineShock />
                            <TugLine />
                            <RearView />
                            <GameAudio />
                            <RemoteEngineAudio />
                            { children }
                        </WorldScene>
                    </Canvas>
                </div>
                <NetHud />
                <FinishFade />
                <TuningPanelMount />
            </TrackContext>
        </WorldProvider>
    );
}
