import { useFrame, useThree } from '@react-three/fiber';
import { classOfShip } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Net, Sim } from '../../game/ecs/traits';
import { onAction } from '../../game/input/actions';
import { gamepadInput } from '../../game/input/gamepad';
import { keyboardInput } from '../../game/input/keyboard';
import { touchInput } from '../../game/input/touch-state';
import { useRoom } from '../../net/room-context/use-room';
import { isMuted, playMusic, setMuted, stopMusic } from '../audio-engine';
import { bindRoomAudio } from '../bind-room-audio';
import { setEngineSpeed, stopEngineLoop } from '../engine-loop';
import { createMoveEdges, stepMoveEdges } from '../movement-edges';
import { musicForPhase } from '../music-for-phase';
import { ensureListener } from '../positional';
import { playSfx, preloadAudio } from '../sfx-map';
import { tuning } from './game-audio.state';

export function GameAudio() {
    const room = useRoom();
    const world = useWorld();
    const camera = useThree( ( s ) => s.camera );
    const edges = useRef( createMoveEdges() );

    // Syncs with the Web Audio engine and the Colyseus room: preload, the engine loop, music and room sound cues.
    useEffect( () => {
        ensureListener( camera );
        const unbind = bindRoomAudio( room );
        void preloadAudio().then( () => playMusic( musicForPhase( room.state.phase ) ) );
        return () => {
            unbind();
            stopEngineLoop();
            stopMusic();
        };
    }, [ room, camera ] );

    // Syncs the input action map with the audio engine: the mute action toggles mute.
    useEffect(
        () =>
            onAction( ( action ) => {
                if ( action === 'mute' ) setMuted( ! isMuted() );
            } ),
        [],
    );

    useFrame( () => {
        world.query( Sim, Net, LocalPlayer ).readEach( ( [ s, net ] ) => {
            const cls = classOfShip( net.shipId );
            const max = cls.tuning.maxCruise;
            setEngineSpeed( max > 0 ? s.vz / max : 0, net.shipId );
            const brake = Math.max( keyboardInput.brake, touchInput.brake, gamepadInput.brake );
            tuning.maxCruise = max;
            tuning.jumpImpulse = cls.tuning.jumpImpulse;
            tuning.heavy = cls.id === 'freighter';
            for ( const cue of stepMoveEdges( edges.current, s, brake, tuning ) ) {
                if ( cue.sfx === 'brake' ) playSfx( 'brake' );
                else if ( cue.sfx === 'jump' ) playSfx( 'jump', { rate: cue.rate } );
                else playSfx( 'land', { gain: 0.9 * cue.gain, rate: cue.rate } );
            }
        } );
    } );

    return null;
}
