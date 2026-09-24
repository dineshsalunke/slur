import { FIXED_DT } from '@slur/shared';
import type { World } from 'koota';
import { songClock } from '../../../song-lab/map';
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

export interface SongMap {
    z0: number;
    t0: number;
    zPerSecond: number;
}

interface LoadedSong {
    analysis: SongAnalysis;
    map: SongMap;
    endT: number;
}

const ROUTE = '/song-lab';
const DRIFT_S = 0.08;
const LEAD_S = 0.05;
const SETTLE_MS = 250;

export const songView = createStore< SongView >( {
    file: '',
    status: 'none',
    muted: false,
    volume: 0.6,
    error: null,
} );

let loaded: LoadedSong | null = null;
let given: SongMap | null = null;
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

export function songTimeAt( map: SongMap, crossTick: number | null, ticks: number, alpha: number ): number | null {
    return crossTick === null ? null : map.t0 + ( ticks + alpha - crossTick ) * FIXED_DT;
}

export function shipTimeAt( map: SongMap, z: number ): number {
    return map.t0 + ( z - map.z0 ) / map.zPerSecond;
}

export function songTarget( songT: number | null, endT: number, running: boolean ): number | null {
    if ( ! running || songT === null ) return null;
    return songT >= 0 && songT < endT ? songT : null;
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

export function defaultSongMap( a: SongAnalysis ): SongMap {
    const c = songClock( a );
    return { z0: c.z0, t0: c.t0, zPerSecond: c.zPerSecond };
}

export async function loadSong( file: string, map: SongMap | null ): Promise< void > {
    watchLeave();
    given = map;
    if ( loaded && songView.get().file === file && songView.get().status === 'ready' ) {
        loaded = { ...loaded, map: map ?? defaultSongMap( loaded.analysis ) };
        return;
    }
    if ( songView.get().file === file && songView.get().status === 'loading' ) return;
    loaded = null;
    patch( { file, status: 'loading', error: null } );
    try {
        const analysis = await findAnalysis( file );
        if ( ! analysis ) throw new Error( `no analysis for ${ file }` );
        await fillClip( analysis );
        if ( songView.get().file !== file ) return;
        const endT = Math.min( analysis.duration, loopTimes().toS );
        loaded = { analysis, map: given ?? defaultSongMap( analysis ), endT };
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

export function barLabel( a: SongAnalysis, t: number, endT: number ): string {
    const g = gridAt( a, Math.min( Math.max( t, 0 ), endT ) );
    const bar = Math.min( Math.max( g.bar, -1 ), a.bars.length - 1 );
    const beat = bar === g.bar ? Math.floor( g.beatInBar ) + 1 : 1;
    return `${ bar + 1 }.${ beat }`;
}

function readout( song: LoadedSong, songT: number | null, want: number | null, z: number ): string {
    const view = replayView.get();
    const shipT = shipTimeAt( song.map, z );
    const shipBar = barLabel( song.analysis, shipT, song.endT );
    if ( songT === null ) return `song waits for z ${ Math.round( song.map.z0 ) } · ship bar ${ shipBar }`;
    const state =
        songT >= song.endT
            ? 'ended'
            : view.speed !== 1
              ? `muted at ${ view.speed }×`
              : want === null
                ? 'stopped'
                : 'playing';
    const lead = shipT - songT;
    const sign = lead >= 0 ? '+' : '−';
    const songBar = barLabel( song.analysis, songT, song.endT );
    return `song ${ state } · song bar ${ songBar } · ship bar ${ shipBar } (${ sign }${ Math.abs( lead ).toFixed( 2 ) } s)`;
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
        void loadSong( song.analysis.song, given );
        return;
    }
    const view = replayView.get();
    const running = view.playing && view.speed === 1 && replayLive();
    const songT = songTimeAt( song.map, replay.crossTick, replay.tally.ticks, alpha );
    const want = songTarget( songT, song.endT, running );
    const heard = heardNow();
    line = readout( song, songT, want, shipZ( world ) );
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
