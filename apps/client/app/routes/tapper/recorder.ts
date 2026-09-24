import { createStore } from './external-store';
import { barTime } from './song-grid';
import { placeNotes, type TapNote } from './take-model';
import { recordTake } from './takes-store';
import { createGestures, type Gestures } from './tap-gestures';
import { clockStore, elapsedAtPerf, loopTimes, onFrame, type Playhead, play, playheadAt, stop } from './tapper-clock';

export interface RecState {
    mode: 'off' | 'armed' | 'on';
    pass: number;
    live: TapNote[];
}

const EARLY_SLACK_BEATS = 0.5;

export const recStore = createStore< RecState >( { mode: 'off', pass: 0, live: [] } );
let gestures: Gestures | null = null;

function heardPass(): number {
    const e = elapsedAtPerf( performance.now() );
    return e === null ? 0 : ( playheadAt( e )?.pass ?? 0 );
}

export function cancelRecording(): void {
    gestures = null;
    if ( recStore.get().mode !== 'off' ) recStore.set( { mode: 'off', pass: 0, live: [] } );
}

export function toggleRecord(): void {
    if ( recStore.get().mode !== 'off' ) {
        cancelRecording();
        return;
    }
    const s = clockStore.get();
    if ( ! s.song || s.status === 'idle' || s.status === 'loading' ) return;
    let pass = 0;
    if ( s.status === 'playing' ) pass = heardPass() + 1;
    else play( barTime( s.song, s.loopFrom - 1 ) );
    gestures = createGestures( 60 / s.song.bpm );
    recStore.set( { mode: 'armed', pass, live: [] } );
}

export function togglePlay(): void {
    cancelRecording();
    if ( clockStore.get().status === 'playing' ) stop();
    else play();
}

export function seekBars( delta: number ): void {
    const s = clockStore.get();
    const e = elapsedAtPerf( performance.now() );
    const ph = e === null ? null : playheadAt( e );
    if ( ! s.song || ! ph ) return;
    cancelRecording();
    const bar = Math.max( s.loopFrom - 1, Math.min( s.loopTo - 1, ph.bar + delta ) );
    play( barTime( s.song, bar ) );
}

function recordTime( ph: Playhead, pass: number ): number | null {
    if ( ph.pass === pass ) return ph.songT;
    const song = clockStore.get().song;
    if ( ph.pass !== pass - 1 || ! song ) return null;
    const { fromS, toS } = loopTimes();
    const early = ph.pass === -1 ? ph.songT - fromS : ph.songT - toS;
    return early >= ( -EARLY_SLACK_BEATS * 60 ) / song.bpm ? fromS + early : null;
}

function refreshLive(): void {
    const s = clockStore.get();
    if ( ! gestures || ! s.song ) return;
    recStore.set( { ...recStore.get(), live: placeNotes( s.song, gestures.notes(), s.loopFrom ) } );
}

export function recordKey( code: string, shift: boolean, down: boolean, perfMs: number ): void {
    const r = recStore.get();
    if ( r.mode === 'off' || ! gestures ) return;
    const e = elapsedAtPerf( perfMs );
    const ph = e === null ? null : playheadAt( e );
    const t = ph ? recordTime( ph, r.pass ) : null;
    if ( t === null ) return;
    gestures.feed( { code, shift, down, t, ms: perfMs } );
    refreshLive();
}

function finish(): void {
    const s = clockStore.get();
    if ( ! gestures || ! s.song ) {
        cancelRecording();
        return;
    }
    gestures.flush( loopTimes().toS );
    const notes = placeNotes( s.song, gestures.notes(), s.loopFrom );
    recordTake( s.song.song, notes, { fromBar: s.loopFrom, toBar: s.loopTo, rate: s.rate } );
    cancelRecording();
}

onFrame( ( ph ) => {
    const r = recStore.get();
    if ( r.mode === 'armed' && ph.pass === r.pass ) recStore.set( { ...r, mode: 'on' } );
    else if ( r.mode !== 'off' && ph.pass > r.pass ) finish();
} );
