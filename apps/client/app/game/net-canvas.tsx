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
import { playSfx } from '../audio/sfx-map';
import { renderDpr } from '../dev/render-scale.utils';
import { TuningPanelMount } from '../dev/tuning-panel-mount';
import { attachRoomToWorld } from '../net/attach-room-to-world';
import { createPredictor } from '../net/prediction';
import { useRoom } from '../net/room-context/use-room';
import { Held, LocalPlayer } from './ecs/traits';
import { world } from './ecs/world';
import { FinishFade } from './finish/finish-fade';
import { onAction } from './input/actions';
import { lastInputSeq } from './input/current-input';
import { attachKeyboard } from './input/keyboard';
import { runPowerAction } from './input/power-select';
import { NetHud } from './net-hud';
import { NetLoop } from './net-loop/net-loop';
import { PhaseGate } from './phase-gate/phase-gate';
import { ON_TRACK_PHASES } from './phase-gate/phase-gate.constants';
import { CANVAS_GL } from './scene/canvas-gl';
import { MineField } from './scene/mine-field';
import { MineShock } from './scene/mine-shock/mine-shock';
import { NetPowerArc } from './scene/net-power-arc';
import { PickupField } from './scene/pickup-field';
import { PortalField } from './scene/portal-field/portal-field';
import { ProjectileField } from './scene/projectile-field/projectile-field';
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

    // Syncs the input action map with the Colyseus room: power actions send fire and drop messages.
    useEffect( () => {
        const actions = {
            rack: () => world.queryFirst( LocalPlayer, Held )?.get( Held )?.slots ?? [],
            fire: ( slot: number, dir: FireDir ) =>
                room.send( USE_POWERUP_MESSAGE, { slot, dir, seq: lastInputSeq() } ),
            drop: ( slot: number ) => room.send( DROP_POWERUP_MESSAGE, { slot } ),
            tick: () => playSfx( 'uiNav' ),
        };
        return onAction( ( action ) => runPowerAction( action, actions ) );
    }, [ room ] );

    // Syncs the Colyseus room into the koota world: schema callbacks feed the entities and the predictor.
    useEffect( () => attachRoomToWorld( room, world, predictor, trackRef ), [ room, predictor ] );

    return (
        <WorldProvider world={ world }>
            <TrackContext value={ track }>
                <div className="fixed inset-0">
                    <Canvas
                        gl={ CANVAS_GL }
                        dpr={ renderDpr() }
                        camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
                    >
                        <WorldScene>
                            <NetLoop predictor={ predictor } room={ room } />
                            <PickupField />
                            <ProjectileField />
                            <SeekerField />
                            <MineField />
                            <MineShock />
                            <TugLine />
                            <PortalField />
                            <PhaseGate phases={ ON_TRACK_PHASES }>
                                <NetPowerArc />
                            </PhaseGate>
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
