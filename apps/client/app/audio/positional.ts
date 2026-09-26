import * as THREE from 'three';
import { getBuffer, getBus, getContext, getListener, setListener } from './audio-engine';

export function ensureListener( camera: THREE.Camera ): THREE.AudioListener | null {
    if ( ! getContext() ) return null;
    let listener = getListener();
    if ( listener ) {
        if ( listener.parent !== camera ) camera.add( listener );
        return listener;
    }
    listener = new THREE.AudioListener();
    camera.add( listener );
    setListener( listener );
    return listener;
}

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

export function detachPositional( audio: THREE.PositionalAudio | null ): void {
    if ( ! audio ) return;
    try {
        if ( audio.isPlaying ) audio.stop();
    } catch {}
    audio.removeFromParent();
    audio.disconnect();
}
