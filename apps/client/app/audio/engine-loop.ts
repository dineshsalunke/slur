import { getBuffer, getBus, getContext } from './audio-engine';
import { createEngineParams, engineParams, engineVoice } from './engine-voice';
import { ENGINE_LOOP } from './sfx-map';

const SMOOTH_S = 0.08;
const params = createEngineParams();

interface Loop {
    src: AudioBufferSourceNode;
    filter: BiquadFilterNode;
    gain: GainNode;
}

let loop: Loop | null = null;
let wanted = false;

function build(): Loop | null {
    const ctx = getContext();
    const bus = getBus( 'engine' );
    const buffer = getBuffer( ENGINE_LOOP.name );
    if ( ! ctx || ! bus || ! buffer ) return null;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect( bus );

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    filter.connect( gain );

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect( filter );
    src.start();

    return { src, filter, gain };
}

export function startEngineLoop(): void {
    wanted = true;
    loop ??= build();
}

export function setEngineSpeed( v01: number, shipId: string ): void {
    if ( ! wanted ) return;
    loop ??= build();
    const ctx = getContext();
    if ( ! loop || ! ctx ) return;
    const p = engineParams( v01, engineVoice( shipId ), params );
    const now = ctx.currentTime;
    loop.src.playbackRate.setTargetAtTime( p.rate, now, SMOOTH_S );
    loop.filter.frequency.setTargetAtTime( p.cutoff, now, SMOOTH_S );
    loop.gain.gain.setTargetAtTime( p.gain, now, SMOOTH_S );
}

export function stopEngineLoop(): void {
    wanted = false;
    if ( ! loop ) return;
    try {
        loop.src.stop();
    } catch {}
    loop.src.disconnect();
    loop.filter.disconnect();
    loop.gain.disconnect();
    loop = null;
}
