import { useFrame, useThree } from '@react-three/fiber';
import { classOfShip } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Net, Sim } from '../game/ecs/traits';
import { gamepadInput } from '../game/input/gamepad';
import { keyboardInput } from '../game/input/keyboard';
import { touchInput } from '../game/input/touch-state';
import { useRoom } from '../net/room-context';
import { isMuted, playMusic, setMuted, stopMusic } from './audio-engine';
import { bindRoomAudio } from './bind-room-audio';
import { setEngineSpeed, startEngineLoop, stopEngineLoop } from './engine-loop';
import { createMoveEdges, type MoveTuning, stepMoveEdges } from './movement-edges';
import { ensureListener } from './positional';
import { MUSIC, playSfx, preloadAudio } from './sfx-map';

const tuning: MoveTuning = { maxCruise: 0, jumpImpulse: 0, heavy: false };

export function GameAudio() {
    const room = useRoom();
    const world = useWorld();
    const camera = useThree( ( s ) => s.camera );
    const edges = useRef( createMoveEdges() );

    // JUSTIFIED EFFECT — syncs with external systems: the Web Audio engine (preload/engine loop) + the Colyseus room
    useEffect( () => {
        ensureListener( camera );
        startEngineLoop();
        const unbind = bindRoomAudio( room );
        playMusic( MUSIC.lobby.name );
        void preloadAudio().then( () => playMusic( MUSIC.lobby.name ) );
        return () => {
            unbind();
            stopEngineLoop();
            stopMusic();
        };
    }, [ room, camera ] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard (M) → the engine's mute (office needs a
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code === 'KeyM' && ! e.repeat ) setMuted( ! isMuted() );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

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
