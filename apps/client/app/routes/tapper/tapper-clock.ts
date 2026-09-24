import type { SongAnalysis } from '../../../tapper/beat-analysis';
import { createStore } from './external-store';
import { barTime, gridAt, isDownbeat } from './song-grid';

export interface ClockState {
    status: 'idle' | 'loading' | 'ready' | 'playing';
    song: SongAnalysis | null;
    fromBar: number;
    toBar: number;
    rate: number;
    loopFrom: number;
    loopTo: number;
    click: boolean;
    error: string | null;
}

export interface Playhead {
    songT: number;
    bar: number;
    beatInBar: number;
    pass: number;
}

interface Clip {
    buffer: AudioBuffer;
    originS: number;
    beats: { c: number; down: boolean }[];
}

interface Run {
    src: AudioBufferSourceNode;
    t0: number;
    start: number;
    loopStart: number;
    loopEnd: number;
    scheduledTo: number;
}

const LOOKAHEAD_S = 0.2;
const TAIL_S = 0.3;
const CLICK_GAIN = 0.5;

export const clockStore = createStore< ClockState >( {
    status: 'idle',
    song: null,
    fromBar: 0,
    toBar: 0,
    rate: 1,
    loopFrom: 0,
    loopTo: 0,
    click: true,
    error: null,
} );

let ctx: AudioContext | null = null;
let clickBus: GainNode | null = null;
let songBus: GainNode | null = null;
let songGain = 1;
let clip: Clip | null = null;
let run: Run | null = null;
const frameSubs = new Set< ( p: Playhead ) => void >();

function patch( p: Partial< ClockState > ): void {
    clockStore.set( { ...clockStore.get(), ...p } );
}

function audio(): AudioContext {
    if ( ! ctx ) {
        ctx = new AudioContext();
        clickBus = ctx.createGain();
        clickBus.gain.value = clockStore.get().click ? CLICK_GAIN : 0;
        clickBus.connect( ctx.destination );
        songBus = ctx.createGain();
        songBus.gain.value = songGain;
        songBus.connect( ctx.destination );
    }
    void ctx.resume();
    return ctx;
}

export function setSongGain( gain: number ): void {
    songGain = gain;
    if ( songBus ) songBus.gain.value = gain;
}

export function audioRunning(): boolean {
    if ( ! ctx ) return false;
    if ( ctx.state === 'suspended' ) void ctx.resume();
    return ctx.state === 'running';
}

export function outputLatency(): number {
    return ctx?.outputLatency ?? 0;
}

const toClip = ( songT: number ) => ( songT - ( clip?.originS ?? 0 ) ) / clockStore.get().rate;
const toSong = ( c: number ) => ( clip?.originS ?? 0 ) + c * clockStore.get().rate;

export async function loadSection( song: SongAnalysis, fromBar: number, toBar: number, rate: number ): Promise< void > {
    stop();
    patch( { status: 'loading', error: null } );
    const originS = Math.max( 0, barTime( song, fromBar - 1 ) );
    const endS = Math.min( song.duration, barTime( song, toBar ) + TAIL_S );
    const q = new URLSearchParams( {
        song: song.song,
        from: String( originS ),
        to: String( endS ),
        rate: String( rate ),
    } );
    try {
        const res = await fetch( `/__tapper/clip?${ q }` );
        if ( ! res.ok ) throw new Error( ( await res.json() ).error ?? `clip ${ res.status }` );
        const buffer = await audio().decodeAudioData( await res.arrayBuffer() );
        const beats = song.beats
            .map( ( t, i ) => ( { c: ( t - originS ) / rate, down: isDownbeat( song, i ) } ) )
            .filter( ( b ) => b.c >= 0 && b.c < buffer.duration );
        clip = { buffer, originS, beats };
        patch( { status: 'ready', song, fromBar, toBar, rate, loopFrom: fromBar, loopTo: toBar } );
    } catch ( e ) {
        clip = null;
        patch( { status: 'idle', error: String( e ) } );
    }
}

function posAt( r: Run, e: number ): { c: number; pass: number } {
    const p = r.start + e;
    if ( p < r.loopEnd ) return { c: p, pass: p < r.loopStart ? -1 : 0 };
    const len = r.loopEnd - r.loopStart;
    const over = p - r.loopEnd;
    return { c: r.loopStart + ( over % len ), pass: 1 + Math.floor( over / len ) };
}

function blip( when: number, down: boolean ): void {
    if ( ! ctx || ! clickBus ) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = down ? 1760 : 1100;
    g.gain.setValueAtTime( down ? 1 : 0.55, when );
    g.gain.exponentialRampToValueAtTime( 0.001, when + 0.04 );
    osc.connect( g ).connect( clickBus );
    osc.start( when );
    osc.stop( when + 0.05 );
}

function scheduleClicks( r: Run, a: number, b: number ): void {
    const len = r.loopEnd - r.loopStart;
    for ( const bt of clip?.beats ?? [] ) {
        const first = bt.c - r.start;
        if ( bt.c >= r.start && bt.c < r.loopEnd && first >= a && first < b ) blip( r.t0 + first, bt.down );
        if ( bt.c < r.loopStart || bt.c >= r.loopEnd ) continue;
        const e0 = r.loopEnd - r.start + ( bt.c - r.loopStart );
        for ( let e = e0 + Math.max( 0, Math.ceil( ( a - e0 ) / len ) ) * len; e < b; e += len ) {
            if ( e >= a ) blip( r.t0 + e, bt.down );
        }
    }
}

export function elapsedAtPerf( perfMs: number ): number | null {
    if ( ! run || ! ctx ) return null;
    const ts = ctx.getOutputTimestamp();
    const ctxT = ( ts.contextTime ?? ctx.currentTime ) + ( perfMs - ( ts.performanceTime ?? perfMs ) ) / 1000;
    return ctxT - run.t0;
}

export function playheadAt( e: number ): Playhead | null {
    const song = clockStore.get().song;
    if ( ! run || ! song ) return null;
    const { c, pass } = posAt( run, Math.max( 0, e ) );
    const songT = toSong( c );
    const g = gridAt( song, songT );
    return { songT, bar: g.bar, beatInBar: g.beatInBar, pass };
}

export function loopTimes(): { fromS: number; toS: number } {
    const s = clockStore.get();
    return { fromS: s.song ? barTime( s.song, s.loopFrom ) : 0, toS: s.song ? barTime( s.song, s.loopTo ) : 0 };
}

function tick( r: Run ): void {
    if ( run !== r || ! ctx ) return;
    const ahead = ctx.currentTime - r.t0 + LOOKAHEAD_S;
    scheduleClicks( r, r.scheduledTo, ahead );
    r.scheduledTo = ahead;
    const heard = playheadAt( elapsedAtPerf( performance.now() ) ?? 0 );
    if ( heard ) for ( const cb of frameSubs ) cb( heard );
    requestAnimationFrame( () => tick( r ) );
}

export function play( fromS?: number ): void {
    const s = clockStore.get();
    if ( ! clip || ! s.song ) return;
    stop();
    const ac = audio();
    const { fromS: loopFromS, toS: loopToS } = loopTimes();
    const loopEnd = Math.min( clip.buffer.duration, toClip( loopToS ) );
    const start = Math.min( Math.max( 0, toClip( fromS ?? loopFromS ) ), loopEnd - 0.01 );
    const src = ac.createBufferSource();
    src.buffer = clip.buffer;
    src.loop = true;
    src.loopStart = toClip( loopFromS );
    src.loopEnd = loopEnd;
    src.connect( songBus ?? ac.destination );
    const t0 = ac.currentTime + 0.05;
    src.start( t0, start );
    const r: Run = { src, t0, start, loopStart: src.loopStart, loopEnd, scheduledTo: 0 };
    run = r;
    patch( { status: 'playing' } );
    requestAnimationFrame( () => tick( r ) );
}

export function stop(): void {
    if ( ! run ) return;
    run.src.stop();
    run.src.disconnect();
    run = null;
    if ( clickBus && ctx ) {
        clickBus.disconnect();
        clickBus = ctx.createGain();
        clickBus.gain.value = clockStore.get().click ? CLICK_GAIN : 0;
        clickBus.connect( ctx.destination );
    }
    if ( clockStore.get().status === 'playing' ) patch( { status: 'ready' } );
}

export function setLoop( from: number, to: number ): void {
    const s = clockStore.get();
    const loopFrom = Math.max( s.fromBar, Math.min( from, s.toBar - 1 ) );
    const loopTo = Math.min( s.toBar, Math.max( to, loopFrom + 1 ) );
    const wasPlaying = s.status === 'playing';
    patch( { loopFrom, loopTo } );
    if ( wasPlaying ) play();
}

export function setClick( on: boolean ): void {
    patch( { click: on } );
    if ( clickBus ) clickBus.gain.value = on ? CLICK_GAIN : 0;
}

export function onFrame( cb: ( p: Playhead ) => void ): () => void {
    frameSubs.add( cb );
    return () => {
        frameSubs.delete( cb );
    };
}
