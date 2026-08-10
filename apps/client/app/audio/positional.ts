import * as THREE from 'three';
import { getBuffer, getBus, getListener, setListener } from './audio-engine';

// ── three.js PositionalAudio helpers — the CAMERA is the listener. ───────────────────────────────────────
// Positional cues (a remote ship's engine, a near threat) pan/attenuate by 3D position, giving a real "where
// is the rival/bolt" gameplay signal (AUDIO.md §5). three's PositionalAudio is a child Object3D of the thing
// it emits from, so it moves with that object automatically during render — no per-frame code needed. It
// shares the engine's AudioContext (audio-engine already called THREE.AudioContext.setContext), so these route
// through the same graph. Everything is GRACEFUL: no listener or no decoded buffer → a no-op returning null.

// Ensure the shared AudioListener is parented to the camera (once). three updates the panner math from the
// camera's world transform each frame. Returns null if the audio graph isn't up yet.
export function ensureListener( camera: THREE.Camera ): THREE.AudioListener | null {
    let listener = getListener();
    if ( listener ) {
        if ( listener.parent !== camera ) camera.add( listener );
        return listener;
    }
    // AudioListener's constructor reads THREE.AudioContext.getContext() — which is our engine's context.
    listener = new THREE.AudioListener();
    camera.add( listener );
    setListener( listener );
    return listener;
}

// Attach a looping positional emitter (by sample name) as a child of `obj`. Returns the node so the caller
// can stop()/remove it on despawn, or null if the listener/buffer isn't ready. `refDistance` sets how quickly
// it attenuates with distance.
export function attachPositionalLoop(
    obj: THREE.Object3D,
    name: string,
    opts: { volume?: number; refDistance?: number; rate?: number } = {},
): THREE.PositionalAudio | null {
    const listener = getListener();
    const buffer = getBuffer( name );
    if ( ! listener || ! buffer || ! getBus( 'engine' ) ) return null;
    const audio = new THREE.PositionalAudio( listener );
    audio.setBuffer( buffer );
    audio.setLoop( true );
    audio.setRefDistance( opts.refDistance ?? 14 );
    audio.setVolume( opts.volume ?? 0.5 );
    if ( opts.rate !== undefined ) audio.setPlaybackRate( opts.rate );
    obj.add( audio );
    audio.play();
    return audio;
}

// Stop + detach a positional emitter created above (call on despawn).
export function detachPositional( audio: THREE.PositionalAudio | null ): void {
    if ( ! audio ) return;
    try {
        if ( audio.isPlaying ) audio.stop();
    } catch {
        /* already stopped */
    }
    audio.removeFromParent();
    audio.disconnect();
}
