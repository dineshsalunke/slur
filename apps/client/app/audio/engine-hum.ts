import { getBus, getContext } from './audio-engine';

const FREQ_IDLE = 46;
const FREQ_MAX = 132;
const DETUNE_CENTS = 11;
const CUTOFF_IDLE = 220;
const CUTOFF_MAX = 1500;
const LEVEL_IDLE = 0.14;
const LEVEL_MAX = 0.42;
const SMOOTH_S = 0.08;

interface Hum {
    oscA: OscillatorNode;
    oscB: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
}

let hum: Hum | null = null;

const lerp = ( a: number, b: number, t: number ): number => a + ( b - a ) * t;

export function startEngineHum(): void {
    if ( hum ) return;
    const ctx = getContext();
    const bus = getBus( 'engine' );
    if ( ! ctx || ! bus ) return;

    const gain = ctx.createGain();
    gain.gain.value = LEVEL_IDLE;
    gain.connect( bus );

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = CUTOFF_IDLE;
    filter.Q.value = 0.8;
    filter.connect( gain );

    const oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.value = FREQ_IDLE;
    oscA.connect( filter );
    oscA.start();

    const oscB = ctx.createOscillator();
    oscB.type = 'sawtooth';
    oscB.frequency.value = FREQ_IDLE;
    oscB.detune.value = DETUNE_CENTS;
    oscB.connect( filter );
    oscB.start();

    hum = { oscA, oscB, filter, gain };
}

export function setEngineSpeed( v01: number ): void {
    if ( ! hum ) return;
    const ctx = getContext();
    if ( ! ctx ) return;
    const v = Math.min( Math.max( v01, 0 ), 1 );
    const now = ctx.currentTime;
    const freq = lerp( FREQ_IDLE, FREQ_MAX, v );
    hum.oscA.frequency.setTargetAtTime( freq, now, SMOOTH_S );
    hum.oscB.frequency.setTargetAtTime( freq, now, SMOOTH_S );
    hum.filter.frequency.setTargetAtTime( lerp( CUTOFF_IDLE, CUTOFF_MAX, v ), now, SMOOTH_S );
    hum.gain.gain.setTargetAtTime( lerp( LEVEL_IDLE, LEVEL_MAX, v ), now, SMOOTH_S );
}

export function stopEngineHum(): void {
    if ( ! hum ) return;
    try {
        hum.oscA.stop();
        hum.oscB.stop();
    } catch {}
    hum.oscA.disconnect();
    hum.oscB.disconnect();
    hum.filter.disconnect();
    hum.gain.disconnect();
    hum = null;
}
