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

// ── The audio binding — a thin R3F LEAF mounted inside the game scene (net-canvas). ──────────────────────
// It does NOT own the audio graph (that's the module singleton in audio-engine.ts, outside React). It only:
//  1) kicks off sample preload + starts the synth engine-hum + the room→SFX binding on mount (external sync),
//  2) parks the camera-listener for positional cues, and
//  3) drives the engine-hum pitch from the local ship's speed every frame — refs/imperative, ZERO React
//     re-render (r3f.md #1/#2). No per-frame setState, no allocation in useFrame.
// On unmount it stops only the per-SCENE resources (hum, music, subscriptions) — the context/buses persist.
export function GameAudio() {
    const room = useRoom();
    const world = useWorld();
    const camera = useThree( ( s ) => s.camera );

    // JUSTIFIED EFFECT — syncs with external systems: the Web Audio engine (preload/hum) + the Colyseus room
    // (schema callbacks → SFX/music). The GRAPH is a module singleton (never created/destroyed here); this
    // effect only starts the per-scene reactions and brackets their teardown to the scene's mount.
    //  1) render-derivation? no — audio is a reaction to network/physics events, not derivable from render.
    //  2) event handler? the room callbacks ARE handlers; bindRoomAudio registers them.
    //  3) loader/action data? no — a live wire stream; the loader OWNS the room, this only SUBSCRIBES.
    //  4) ref/module singleton? the engine + room are singletons; only the subscriptions/hum need mount-scoped
    //     teardown so cues stop when the scene unmounts. 5) external sync? YES. VERDICT: keep. Never touches
    //     the socket or the audio graph — only detaches callbacks, stops the hum, and stops the music bed.
    useEffect( () => {
        ensureListener( camera ); // camera = the positional listener (idempotent)
        startEngineHum();
        const unbind = bindRoomAudio( room );
        // Seed the lobby bed immediately in case we mount already in the lobby (the phase .listen also sets it).
        playMusic( MUSIC.lobby.name );
        void preloadAudio().then( () => playMusic( MUSIC.lobby.name ) ); // re-issue once the bed has decoded
        return () => {
            unbind();
            stopEngineHum();
            stopMusic();
        };
    }, [ room, camera ] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard (M) → the engine's mute (office needs a
    // fast mute). The listener IS the handler; the effect only brackets its window lifetime. Mute state lives
    // on the audio-engine singleton (persisted), not React.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code === 'KeyM' && ! e.repeat ) setMuted( ! isMuted() );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

    // Drive the synth engine-hum from the LOCAL ship's forward speed each frame. Read from ECS, write to the
    // Web Audio param — no React, no allocation (tuningForShip returns a shared ref).
    useFrame( () => {
        world.query( Sim, Net, LocalPlayer ).readEach( ( [ s, net ] ) => {
            const max = tuningForShip( net.shipId ).maxCruise;
            setEngineSpeed( max > 0 ? s.vz / max : 0 );
        } );
    } );

    return null;
}
