import type { RootState } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, INPUT_MESSAGE, PHASE, type Track } from '@slur/shared';
import type { World } from 'koota';
import type { PerspectiveCamera } from 'three';
import { simFreeze } from '../../dev/sim-freeze';
import { INPUT_SEND_TICKS, inputChunks } from '../../net/input-chunks';
import type { Predictor } from '../../net/prediction';
import type { RunRoomLike } from '../../net/run-room-like';
import { updateChaseCamera, updateLobbyCamera, updateSpectatorCamera } from '../camera/chase';
import { hoverSystem } from '../ecs/hover';
import { freezeLocalPrev, localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from '../ecs/net-systems';
import { syncRenderSystem } from '../ecs/systems';
import { finishReset, showFinishFade, stepFinishReset } from '../finish/finish-reset';
import { CUT_DT, finishWatch, localFinished, pickWatchTarget, resetFinishWatch } from '../finish/finish-watch';
import { localRole, resetSpectatorTarget, resolveSpectatorTarget, runPhase } from '../spectator';

export interface NetFrame {
    world: World;
    track: Track;
    predictor: Predictor;
    room: RunRoomLike;
    advance: ( elapsedSeconds: number, step: ( dt: number ) => void ) => number;
    step: ( dt: number ) => void;
    racing: boolean;
    unsentTicks: number;
    phase: number;
    alpha: number;
    cut: boolean;
}

export function createNetFrame( world: World, track: Track, predictor: Predictor, room: RunRoomLike ): NetFrame {
    const frame: NetFrame = {
        world,
        track,
        predictor,
        room,
        advance: createFixedStep( FIXED_DT ),
        step: ( dt ) => {
            if ( ! frame.racing ) return;
            netFlightSystem( world, dt, predictor, track );
            frame.unsentTicks++;
        },
        racing: false,
        unsentTicks: 0,
        phase: PHASE.lobby,
        alpha: 0,
        cut: false,
    };
    return frame;
}

export function netFlight( f: NetFrame, _state: RootState, delta: number ): void {
    f.phase = runPhase.value;
    if ( simFreeze.on ) return;
    f.racing = f.phase === PHASE.racing && ! localRole.spectating;
    f.alpha = f.advance( delta, f.step );
    if ( ! f.racing ) freezeLocalPrev( f.world );
}

export function netSendInput( f: NetFrame ): void {
    if ( f.unsentTicks < INPUT_SEND_TICKS ) return;
    f.unsentTicks = 0;
    for ( const inputs of inputChunks( f.predictor.drainUnsent() ) ) f.room.send( INPUT_MESSAGE, { inputs } );
}

export function netRenderInterp( f: NetFrame, _state: RootState, delta: number ): void {
    if ( ! simFreeze.on ) syncRenderSystem( f.world, f.alpha, delta );
}

export function netRemoteInterp( f: NetFrame, _state: RootState, delta: number ): void {
    if ( ! simFreeze.on ) remoteInterpSystem( f.world, delta );
}

export function netHover( f: NetFrame, _state: RootState, delta: number ): void {
    if ( ! simFreeze.on ) hoverSystem( f.world, delta );
}

export function netDeathVfx( f: NetFrame ): void {
    if ( ! simFreeze.on ) localDeathVfxSystem( f.world );
}

export function netFinishCurtain( f: NetFrame, _state: RootState, delta: number ): void {
    f.cut = simFreeze.on ? false : stepFinishCurtain( f.world, f.phase, delta );
}

export function netCamera( f: NetFrame, state: RootState, delta: number ): void {
    updateNetCamera( state.camera as PerspectiveCamera, f.world, delta, f.room, f.phase, f.cut );
}

export function stepFinishCurtain( world: World, phase: number, delta: number ): boolean {
    if ( phase === PHASE.lobby || phase === PHASE.countdown ) resetFinishWatch( finishWatch );
    const ending =
        ! finishWatch.spent && ! localRole.spectating && ( phase === PHASE.finished || localFinished( world ) );
    const cut = stepFinishReset( finishReset, ending, delta ) === 'reset';
    if ( cut ) {
        finishWatch.spent = true;
        finishWatch.cut = true;
    }
    showFinishFade( finishReset );
    return cut;
}

export function updateNetCamera(
    cam: PerspectiveCamera,
    world: World,
    delta: number,
    room: RunRoomLike,
    phase: number,
    cut: boolean,
): void {
    if ( phase === PHASE.lobby ) {
        resetSpectatorTarget();
        updateLobbyCamera( cam, world, delta );
    } else if ( localRole.spectating )
        updateSpectatorCamera( cam, world, delta, resolveSpectatorTarget( room.state.players ) );
    else if ( finishWatch.cut ) updateFinishCamera( cam, world, cut ? CUT_DT : delta, room );
    else updateChaseCamera( cam, world, delta );
}

export function updateFinishCamera( cam: PerspectiveCamera, world: World, dt: number, room: RunRoomLike ): void {
    finishWatch.targetId = pickWatchTarget( room.state.players, room.sessionId, finishWatch.targetId );
    if ( finishWatch.targetId ) updateSpectatorCamera( cam, world, dt, finishWatch.targetId );
    else updateLobbyCamera( cam, world, dt );
}
