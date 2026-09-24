import { FIXED_DT, spawnShip } from '@slur/shared';
import type { World } from 'koota';
import { type SongClock, songClock, tAt } from '../../../song-lab/map';
import type { SongAnalysis } from '../../../tapper/beat-analysis';
import { LocalPlayer, Sim } from '../../game/ecs/traits';
import { createStore } from '../tapper/external-store';
import { gridAt } from '../tapper/song-grid';
import {
    audioRunning,
    clockStore,
    elapsedAtPerf,
    loadSection,
    loopTimes,
    onFrame,
    outputLatency,
    play,
    playheadAt,
    setClick,
    setSongGain,
    stop,
} from '../tapper/tapper-clock';
import { replay, replayLive, replayView } from './replay-state';

export interface SongView {
    file: string;
    status: 'none' | 'loading' | 'ready' | 'error';
    muted: boolean;
    volume: number;
    error: string | null;
}

interface LoadedSong {
    analysis: SongAnalysis;
    clock: SongClock;
    startT: number;
    endT: number;
}

const ROUTE = '/song-lab';
const DRIFT_S = 0.08;
const LEAD_S = 0.05;
const SETTLE_MS = 250;
const SPAWN_Z = spawnShip( 0, 0 ).z;

export const songView = createStore< SongView >( {
    file: '',
    status: 'none',
    muted: false,
    volume: 0.6,
    error: null,
} );

let loaded: LoadedSong | null = null;
let ours = false;
let settleUntil = 0;
let line = '';
let watching = false;

function patch( p: Partial< SongView > ): void {
    songView.set( { ...songView.get(), ...p } );
}

function applyGain(): void {
    const v = songView.get();
    setSongGain( v.muted ? 0 : v.volume );
}

export function toggleSongMute(): void {
    patch( { muted: ! songView.get().muted } );
    applyGain();
}

export function setSongVolume( volume: number ): void {
    patch( { volume } );
    applyGain();
}

export function songTarget(
    startT: number,
    endT: number,
    ticks: number,
    alpha: number,
    running: boolean,
): number | null {
    if ( ! running ) return null;
    const t = startT + ( ticks + alpha ) * FIXED_DT;
    return t >= 0 && t < endT ? t : null;
}

function clockHolds( a: SongAnalysis ): boolean {
    const c = clockStore.get();
    return c.song?.song === a.song && c.fromBar === 0 && c.toBar === a.bars.length && c.rate === 1;
}

async function findAnalysis( file: string ): Promise< SongAnalysis | null > {
    const res = await fetch( '/__tapper/songs' );
    if ( ! res.ok ) throw new Error( `/__tapper/songs ${ res.status }` );
    const songs = ( await res.json() ) as Partial< SongAnalysis >[];
    const hit = songs.find( ( s ) => s.song === file && Array.isArray( s.bars ) );
    return ( hit as SongAnalysis | undefined ) ?? null;
}

async function fillClip( a: SongAnalysis ): Promise< void > {
    ours = false;
    await loadSection( a, 0, a.bars.length, 1 );
    if ( ! clockHolds( a ) ) throw new Error( clockStore.get().error ?? 'clip did not load' );
    setClick( false );
    applyGain();
}

function stopOnLeave(): void {
    if ( ours && location.pathname !== ROUTE ) {
        ours = false;
        stop();
    }
}

function watchLeave(): void {
    if ( watching ) return;
    watching = true;
    onFrame( stopOnLeave );
}

export async function loadSong( file: string ): Promise< void > {
    watchLeave();
    if ( songView.get().file === file && songView.get().status !== 'error' ) return;
    loaded = null;
    patch( { file, status: 'loading', error: null } );
    try {
        const analysis = await findAnalysis( file );
        if ( ! analysis ) throw new Error( `no analysis for ${ file }` );
        await fillClip( analysis );
        if ( songView.get().file !== file ) return;
        const clock = songClock( analysis );
        const endT = Math.min( analysis.duration, loopTimes().toS );
        loaded = { analysis, clock, startT: tAt( clock, SPAWN_Z ), endT };
        patch( { status: 'ready' } );
    } catch ( e ) {
        if ( songView.get().file === file ) patch( { status: 'error', error: String( e ) } );
    }
}

function shipZ( world: World ): number {
    let z = 0;
    world.query( Sim, LocalPlayer ).readEach( ( [ s ] ) => {
        z = s.z;
    } );
    return z;
}

function barOf( a: SongAnalysis, t: number ): string {
    const g = gridAt( a, t );
    return `${ g.bar + 1 }.${ Math.floor( g.beatInBar ) + 1 }`;
}

function readout( song: LoadedSong, want: number | null, z: number, heard: number | null ): string {
    const view = replayView.get();
    const shipT = tAt( song.clock, z );
    const songT = heard ?? song.startT + replay.tally.ticks * FIXED_DT;
    const lead = shipT - songT;
    const state = view.speed !== 1 ? `muted at ${ view.speed }×` : want === null ? 'stopped' : 'playing';
    const sign = lead >= 0 ? '+' : '−';
    return `song ${ state } · song bar ${ barOf( song.analysis, songT ) } · ship bar ${ barOf( song.analysis, shipT ) } (${ sign }${ Math.abs( lead ).toFixed( 2 ) } s)`;
}

function heardNow(): number | null {
    if ( clockStore.get().status !== 'playing' ) return null;
    return playheadAt( elapsedAtPerf( performance.now() ) ?? 0 )?.songT ?? null;
}

export function syncSong( world: World, alpha: number ): void {
    const song = loaded;
    if ( ! song ) {
        line = songView.get().status === 'loading' ? 'song loading…' : '';
        return;
    }
    if ( ! clockHolds( song.analysis ) ) {
        loaded = null;
        patch( { file: '' } );
        void loadSong( song.analysis.song );
        return;
    }
    const view = replayView.get();
    const running = view.playing && view.speed === 1 && replayLive();
    const want = songTarget( song.startT, song.endT, replay.tally.ticks, alpha, running );
    const heard = heardNow();
    line = readout( song, want, shipZ( world ), heard );
    if ( want === null ) {
        if ( ours && heard !== null ) stop();
        ours = false;
        return;
    }
    if ( ! audioRunning() ) return;
    const now = performance.now();
    if ( now < settleUntil ) return;
    if ( ours && heard !== null && Math.abs( heard - want ) < DRIFT_S ) return;
    const lead = LEAD_S + outputLatency();
    settleUntil = now + Math.max( SETTLE_MS, lead * 1000 + 100 );
    ours = true;
    play( want + lead );
}

export function songLine(): string {
    return line;
}
