import { useFrame, useThree } from '@react-three/fiber';
import { tuningForShip } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Net, Sim } from '../game/ecs/traits';
import { useRoom } from '../net/room-context';
import { isMuted, playMusic, setMuted, stopMusic } from './audio-engine';
import { bindRoomAudio } from './bind-room-audio';
import { setEngineSpeed, startEngineHum, stopEngineHum } from './engine-hum';
import { ensureListener } from './positional';
import { MUSIC, preloadAudio } from './sfx-map';

export function GameAudio() {
    const room = useRoom();
    const world = useWorld();
    const camera = useThree( ( s ) => s.camera );

    // JUSTIFIED EFFECT — syncs with external systems: the Web Audio engine (preload/hum) + the Colyseus room
    useEffect( () => {
        ensureListener( camera );
        startEngineHum();
        const unbind = bindRoomAudio( room );
        playMusic( MUSIC.lobby.name );
        void preloadAudio().then( () => playMusic( MUSIC.lobby.name ) );
        return () => {
            unbind();
            stopEngineHum();
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
            const max = tuningForShip( net.shipId ).maxCruise;
            setEngineSpeed( max > 0 ? s.vz / max : 0 );
        } );
    } );

    return null;
}
