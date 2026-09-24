import * as THREE from 'three';

export type Bus = 'threat' | 'combat' | 'ui' | 'engine' | 'music';

const BUS_ORDER: Bus[] = [ 'threat', 'combat', 'ui', 'engine', 'music' ];

const BASE_GAIN: Record< Bus, number > = {
    threat: 0.9,
    combat: 0.85,
    ui: 0.6,
    engine: 0.5,
    music: 0.32,
};

const VOICE_COUNT = 24;
const DUCK_FLOOR = 0.4;
const DUCK_ATTACK_S = 0.02;
const DUCK_RELEASE_S = 0.28;

const STORE_KEY = 'slur.audio';

export interface PlayOpts {
    bus?: Bus;
    gain?: number;
    rate?: number;
    cut?: boolean;
}

interface Voice {
    gain: GainNode;
}

interface LiveCut {
    src: AudioBufferSourceNode;
    fade: GainNode;
}

const CUT_FADE_S = 0.01;
const liveCuts = new Map< string, LiveCut >();

interface Engine {
    ctx: AudioContext;
    master: GainNode;
    limiter: DynamicsCompressorNode;
    buses: Record< Bus, GainNode >;
    voices: Voice[];
    voiceCursor: number;
    listener: THREE.AudioListener | null;
}

const buffers = new Map< string, AudioBuffer | null >();
let engine: Engine | null = null;

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
    } catch {}
} )();

function persist(): void {
    try {
        localStorage.setItem( STORE_KEY, JSON.stringify( { muted, volume } ) );
    } catch {}
}

function masterTarget(): number {
    return muted ? 0 : volume;
}

function ensure(): Engine | null {
    if ( engine ) return engine;
    const Ctor =
        typeof window !== 'undefined' &&
        ( window.AudioContext ||
            ( window as unknown as { webkitAudioContext?: typeof AudioContext } ).webkitAudioContext );
    if ( ! Ctor ) return null;

    const ctx = new Ctor();
    THREE.AudioContext.setContext( ctx );

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

export async function loadSample( name: string, url: string ): Promise< void > {
    const e = ensure();
    if ( ! e || buffers.has( name ) ) return;
    buffers.set( name, null );
    try {
        const res = await fetch( url );
        if ( ! res.ok ) return;
        const arr = await res.arrayBuffer();
        const buf = await e.ctx.decodeAudioData( arr );
        buffers.set( name, buf );
    } catch {}
}

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
    if ( opts.cut ) {
        cutLive( e, name );
        trackCut( e, name, src ).connect( voice.gain );
    } else src.connect( voice.gain );
    duck( e, bus );
    src.start();
}

function cutLive( e: Engine, name: string ): void {
    const prev = liveCuts.get( name );
    if ( ! prev ) return;
    liveCuts.delete( name );
    const now = e.ctx.currentTime;
    const g = prev.fade.gain;
    g.cancelScheduledValues( now );
    g.setValueAtTime( g.value, now );
    g.linearRampToValueAtTime( 0, now + CUT_FADE_S );
    prev.src.stop( now + CUT_FADE_S );
}

function trackCut( e: Engine, name: string, src: AudioBufferSourceNode ): GainNode {
    const fade = e.ctx.createGain();
    src.connect( fade );
    const entry: LiveCut = { src, fade };
    liveCuts.set( name, entry );
    src.onended = () => {
        if ( liveCuts.get( name ) === entry ) liveCuts.delete( name );
        fade.disconnect();
    };
    return fade;
}

export function getBus( bus: Bus ): GainNode | null {
    return ensure()?.buses[ bus ] ?? null;
}

export function getContext(): AudioContext | null {
    return ensure()?.ctx ?? null;
}

export function getBuffer( name: string ): AudioBuffer | null {
    return buffers.get( name ) ?? null;
}

export function setListener( listener: THREE.AudioListener | null ): void {
    const e = ensure();
    if ( e ) e.listener = listener;
}

export function getListener(): THREE.AudioListener | null {
    return engine?.listener ?? null;
}

let music: { src: AudioBufferSourceNode; name: string } | null = null;

export function playMusic( name: string ): void {
    const e = ensure();
    if ( ! e ) return;
    if ( music?.name === name ) return;
    const buf = buffers.get( name );
    stopMusic();
    if ( ! buf ) return;
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
    } catch {}
    music = null;
}

const mutedListeners = new Set< () => void >();

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

export function resume(): void {
    const e = ensure();
    if ( e && e.ctx.state === 'suspended' ) void e.ctx.resume();
}

if ( typeof window !== 'undefined' ) {
    const unlock = (): void => {
        resume();
        window.removeEventListener( 'pointerdown', unlock );
        window.removeEventListener( 'keydown', unlock );
    };
    window.addEventListener( 'pointerdown', unlock );
    window.addEventListener( 'keydown', unlock );
}
