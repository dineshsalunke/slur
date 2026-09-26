import { type Bus, getBuffer, getBus, getContext } from './audio-engine';

const FADE_S = 0.02;

interface LoopVoice {
    src: AudioBufferSourceNode;
    gain: GainNode;
}

const live = new Map< string, LoopVoice >();

export function startLoop( key: string, name: string, bus: Bus, gain: number ): void {
    if ( live.has( key ) ) return;
    const ctx = getContext();
    const out = getBus( bus );
    const buffer = getBuffer( name );
    if ( ! ctx || ! out || ! buffer ) return;
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect( out );
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect( g );
    src.start();
    live.set( key, { src, gain: g } );
}

export function stopLoop( key: string ): void {
    const v = live.get( key );
    const ctx = getContext();
    if ( ! v || ! ctx ) return;
    live.delete( key );
    const now = ctx.currentTime;
    v.gain.gain.cancelScheduledValues( now );
    v.gain.gain.setValueAtTime( v.gain.gain.value, now );
    v.gain.gain.linearRampToValueAtTime( 0, now + FADE_S );
    v.src.stop( now + FADE_S );
    v.src.onended = () => v.gain.disconnect();
}

export function isLooping( key: string ): boolean {
    return live.has( key );
}
