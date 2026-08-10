import { getBus, getContext } from './audio-engine';

// ── Synthesized engine hum — the "speed you can hear" cue (AUDIO.md §4), NO sample. ──────────────────────
// Two slightly-detuned sawtooth oscillators through a low-pass filter, on the 'engine' bus. The one cue a
// looped sample can't do cleanly: pitch/tone/level track velocity continuously. Driven imperatively from the
// local ship's speed each frame via setEngineSpeed(v01) — never React state. Works even if ZERO samples
// downloaded (it's pure oscillators), which is the point.

// Frequency/tone/level envelope across the speed range [0..1]. Idle (v=0) is a low resting rumble; full
// throttle is a brighter, louder tone. Values chosen to read as "engine", not a test tone.
const FREQ_IDLE = 46; // Hz at v=0 (deep rumble)
const FREQ_MAX = 132; // Hz at v=1
const DETUNE_CENTS = 11; // second osc offset → a thicker, beating hum
const CUTOFF_IDLE = 220; // Hz low-pass at v=0 (muffled)
const CUTOFF_MAX = 1500; // Hz at v=1 (opens up with speed)
const LEVEL_IDLE = 0.14; // hum gain at v=0
const LEVEL_MAX = 0.42; // hum gain at v=1
const SMOOTH_S = 0.08; // setTargetAtTime time-constant — glides between speeds, no zipper noise

interface Hum {
    oscA: OscillatorNode;
    oscB: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
}

let hum: Hum | null = null;

const lerp = ( a: number, b: number, t: number ): number => a + ( b - a ) * t;

// Start the hum (idempotent). No-op if the audio graph isn't available. Begins at idle; drive it with
// setEngineSpeed each frame.
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

// Feed the local ship's normalized speed (0 = stopped, 1 = maxCruise) every frame. Glides pitch/cutoff/level
// smoothly. Cheap + allocation-free — safe to call from useFrame.
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

// Stop + tear down the hum (called when the game scene unmounts). The engine GRAPH (context/buses) persists;
// only these per-scene oscillators are disposed — they can't be restarted, so we drop the ref for a fresh start.
export function stopEngineHum(): void {
    if ( ! hum ) return;
    try {
        hum.oscA.stop();
        hum.oscB.stop();
    } catch {
        /* already stopped */
    }
    hum.oscA.disconnect();
    hum.oscB.disconnect();
    hum.filter.disconnect();
    hum.gain.disconnect();
    hum = null;
}
