import * as THREE from 'three';

// ── SLUR audio engine — a MODULE SINGLETON, deliberately OUTSIDE React. ────────────────────────────────
// The Web Audio graph (AudioContext + master limiter + per-category duck buses + the sample cache + a voice
// pool) is a LONG-LIVED resource, so it lives here on the module — built ONCE, lazily, and NEVER owned by a
// component's useEffect cleanup. Coupling a long-lived resource (a socket, a context) to a mount lifetime is
// the exact class of bug that cost this project a whole slice (CLAUDE.md non-negotiable #8). React components
// only *react* to game events — they call play()/setEngineSpeed()/playMusic(); they never create or dispose
// the graph. Every method is GRACEFUL: before init, or with a missing sample, it is a silent no-op — audio
// can never throw into the 60Hz game loop.
//
// Autoplay policy: the browser starts the context 'suspended'. On module load we install ONE-TIME global
// pointerdown/keydown listeners that resume it on the first user gesture (host Start / player Join click) —
// per the spec, this lives in the engine, NOT in any route component.

// Bus = a mix category. Priority is the duck order from AUDIO.md §5:
//   threat > combat > pickups/UI > engine > music
// A cue on a given bus briefly ducks every LOWER-priority bus so feedback never gets buried under the music.
export type Bus = 'threat' | 'combat' | 'ui' | 'engine' | 'music';

// High → low priority. Index in this array IS the priority rank (0 = highest).
const BUS_ORDER: Bus[] = [ 'threat', 'combat', 'ui', 'engine', 'music' ];

// Resting gain per bus (relative; the master gain scales all of them). SFX sit above the music bed so the
// mix reads "feedback first". Engine hum is a background layer; music is quietest so cues cut through.
const BASE_GAIN: Record< Bus, number > = {
    threat: 0.9,
    combat: 0.85,
    ui: 0.6,
    engine: 0.5,
    music: 0.32,
};

const VOICE_COUNT = 24; // polyphony cap + a reusable GainNode pool for rapid-fire cues (bolts) — no per-play alloc
const DUCK_FLOOR = 0.4; // lower buses drop to this fraction of their base when a higher-priority cue fires
const DUCK_ATTACK_S = 0.02; // how fast the duck clamps down (seconds)
const DUCK_RELEASE_S = 0.28; // how fast lower buses recover to base after the cue

const STORE_KEY = 'slur.audio'; // persisted { muted, volume } so an office mute survives a reload

export interface PlayOpts {
    bus?: Bus; // which mix category; default 'combat'
    gain?: number; // per-shot linear gain (0..1+); default 1
    rate?: number; // playbackRate (pitch/speed); default 1
}

interface Voice {
    gain: GainNode;
}

interface Engine {
    ctx: AudioContext;
    master: GainNode; // user volume / mute lives here
    limiter: DynamicsCompressorNode; // master limiter — guards against a stacked-cue clip
    buses: Record< Bus, GainNode >;
    voices: Voice[];
    voiceCursor: number;
    listener: THREE.AudioListener | null; // set lazily when the camera-listener is attached (positional cues)
}

const buffers = new Map< string, AudioBuffer | null >(); // name → decoded sample; null = tried & failed/absent (no-op)
let engine: Engine | null = null;

// Persisted mix prefs, read eagerly (safe: pure localStorage). Applied to the master gain the moment the
// graph is built, so a muted session stays muted through the lazy init.
let muted = false;
let volume = 0.8;
( () => {
    try {
        const raw = typeof localStorage !== 'undefined' && localStorage.getItem( STORE_KEY );
        if ( raw ) {
            const v = JSON.parse( raw ) as { muted?: boolean; volume?: number };
            if ( typeof v.muted === 'boolean' ) muted = v.muted;
            if ( typeof v.volume === 'number' ) volume = v.volume;
        }
    } catch {
        /* corrupt/absent storage → defaults */
    }
} )();

function persist(): void {
    try {
        localStorage.setItem( STORE_KEY, JSON.stringify( { muted, volume } ) );
    } catch {
        /* private mode / no storage → in-memory only */
    }
}

function masterTarget(): number {
    return muted ? 0 : volume;
}

// Build the graph ONCE, lazily. Returns null when Web Audio is unavailable (SSR/old browser) → all callers
// degrade to no-ops. Shares the context with three.js (THREE.AudioContext.setContext) so PositionalAudio and
// the synth engine-hum route through the SAME graph and master limiter.
function ensure(): Engine | null {
    if ( engine ) return engine;
    const Ctor =
        typeof window !== 'undefined' &&
        ( window.AudioContext ||
            ( window as unknown as { webkitAudioContext?: typeof AudioContext } ).webkitAudioContext );
    if ( ! Ctor ) return null;

    const ctx = new Ctor();
    THREE.AudioContext.setContext( ctx ); // three's PositionalAudio/AudioListener now share this graph

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;

    const master = ctx.createGain();
    master.gain.value = masterTarget();
    master.connect( limiter );
    limiter.connect( ctx.destination );

    const buses = {} as Record< Bus, GainNode >;
    for ( const b of BUS_ORDER ) {
        const g = ctx.createGain();
        g.gain.value = BASE_GAIN[ b ];
        g.connect( master );
        buses[ b ] = g;
    }

    const voices: Voice[] = [];
    for ( let i = 0; i < VOICE_COUNT; i++ ) {
        voices.push( { gain: ctx.createGain() } );
    }

    engine = { ctx, master, limiter, buses, voices, voiceCursor: 0, listener: null };
    return engine;
}

// Duck every bus with LOWER priority than `bus`: dip to BASE*DUCK_FLOOR then ramp back to base.
function duck( e: Engine, bus: Bus ): void {
    const p = BUS_ORDER.indexOf( bus );
    const now = e.ctx.currentTime;
    for ( let i = p + 1; i < BUS_ORDER.length; i++ ) {
        const name = BUS_ORDER[ i ];
        const g = e.buses[ name ].gain;
        const base = BASE_GAIN[ name ];
        g.cancelScheduledValues( now );
        g.setTargetAtTime( base * DUCK_FLOOR, now, DUCK_ATTACK_S );
        g.setTargetAtTime( base, now + DUCK_RELEASE_S, DUCK_RELEASE_S );
    }
}

function nextVoice( e: Engine ): Voice {
    const v = e.voices[ e.voiceCursor ];
    e.voiceCursor = ( e.voiceCursor + 1 ) % e.voices.length;
    return v;
}

// ── Public API ─────────────────────────────────────────────────────────────────────────────────────────

// Fetch → decodeAudioData → cache. Idempotent per name; a failure caches null so play() stays a no-op (never
// a throw). Safe to call repeatedly (sfx-map preload).
export async function loadSample( name: string, url: string ): Promise< void > {
    const e = ensure();
    if ( ! e || buffers.has( name ) ) return;
    buffers.set( name, null ); // reserve → concurrent callers don't double-fetch; stays null on any failure
    try {
        const res = await fetch( url );
        if ( ! res.ok ) return;
        const arr = await res.arrayBuffer();
        const buf = await e.ctx.decodeAudioData( arr );
        buffers.set( name, buf );
    } catch {
        /* graceful: missing/undecodable sample → leave null → play() no-ops */
    }
}

// One-shot cue. Missing or not-yet-loaded sample → silent no-op. Uses a pooled voice gain (reused round-robin)
// so a machine-gun of bolts allocates only a throwaway BufferSource (the Web Audio design), never a GainNode.
export function play( name: string, opts: PlayOpts = {} ): void {
    const e = ensure();
    if ( ! e ) return;
    const buf = buffers.get( name );
    if ( ! buf ) return;
    const bus = opts.bus ?? 'combat';
    const voice = nextVoice( e );
    voice.gain.disconnect();
    voice.gain.connect( e.buses[ bus ] );
    voice.gain.gain.value = opts.gain ?? 1;
    const src = e.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 1;
    src.connect( voice.gain );
    duck( e, bus );
    src.start();
}

// Expose the raw bus node (engine-hum + positional connect their own graphs here). Null before init.
export function getBus( bus: Bus ): GainNode | null {
    return ensure()?.buses[ bus ] ?? null;
}

export function getContext(): AudioContext | null {
    return ensure()?.ctx ?? null;
}

export function getBuffer( name: string ): AudioBuffer | null {
    return buffers.get( name ) ?? null;
}

// The shared listener lives on the camera (set once by the positional helper). Stored so per-ship positional
// cues can find it without prop-drilling.
export function setListener( listener: THREE.AudioListener | null ): void {
    const e = ensure();
    if ( e ) e.listener = listener;
}

export function getListener(): THREE.AudioListener | null {
    return engine?.listener ?? null;
}

// ── Music (looping bed on the music bus, ducked under every SFX category) ────────────────────────────────

let music: { src: AudioBufferSourceNode; name: string } | null = null;

// Loop `name` on the music bus; a no-op if the sample is missing or already the current track. Stops the
// outgoing track first (buffer-source loops are cheap to restart).
export function playMusic( name: string ): void {
    const e = ensure();
    if ( ! e ) return;
    if ( music?.name === name ) return;
    const buf = buffers.get( name );
    stopMusic();
    if ( ! buf ) return; // missing music sample → silence, not a throw
    const src = e.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect( e.buses.music );
    src.start();
    music = { src, name };
}

export function stopMusic(): void {
    if ( ! music ) return;
    try {
        music.src.stop();
    } catch {
        /* already stopped */
    }
    music = null;
}

// ── Mix control (office needs a fast mute) ───────────────────────────────────────────────────────────────

// Mute subscribers. The engine is a module singleton OUTSIDE React (non-negotiable #8), so anything that
// wants to RENDER the mute state needs a change signal. This is that signal and nothing more — the state
// itself still lives here, not in React, and `isMuted()` stays the single read path.
const mutedListeners = new Set< () => void >();

// Subscribe to mute changes. Shaped for `useSyncExternalStore`: takes the callback, returns its unsubscribe.
export function subscribeMuted( onChange: () => void ): () => void {
    mutedListeners.add( onChange );
    return () => {
        mutedListeners.delete( onChange );
    };
}

export function setMuted( m: boolean ): void {
    muted = m;
    persist();
    const e = engine;
    if ( e ) e.master.gain.setTargetAtTime( masterTarget(), e.ctx.currentTime, 0.02 );
    // Notify HERE rather than in toggleMute(): this is the ONE write path — `toggleMute()` delegates to it and
    // the `M` key calls it directly (game-audio.tsx) — so every mute change reaches subscribers, whatever
    // triggered it. That is what keeps the button and the key in sync in both directions, for free.
    for ( const listener of mutedListeners ) listener();
}

export function toggleMute(): boolean {
    setMuted( ! muted );
    return muted;
}

export function isMuted(): boolean {
    return muted;
}

export function setVolume( v: number ): void {
    volume = Math.min( Math.max( v, 0 ), 1 );
    persist();
    const e = engine;
    if ( e && ! muted ) e.master.gain.setTargetAtTime( volume, e.ctx.currentTime, 0.02 );
}

export function getVolume(): number {
    return volume;
}

// Resume the context (call on a user gesture). Idempotent; safe before init.
export function resume(): void {
    const e = ensure();
    if ( e && e.ctx.state === 'suspended' ) void e.ctx.resume();
}

// ── Autoplay unlock: one-time global gesture listeners installed on module load. ─────────────────────────
// The FIRST pointerdown/keydown builds + resumes the graph, then removes itself. This is the engine's job
// (spec) — no route component is touched for it.
if ( typeof window !== 'undefined' ) {
    const unlock = (): void => {
        resume();
        window.removeEventListener( 'pointerdown', unlock );
        window.removeEventListener( 'keydown', unlock );
    };
    window.addEventListener( 'pointerdown', unlock );
    window.addEventListener( 'keydown', unlock );
}
