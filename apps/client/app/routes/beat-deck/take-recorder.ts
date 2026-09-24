import {
    DEFAULT_SHIP,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    type PlayerInput,
    type ShipId,
    type SimShip,
    tuningForShip,
} from '@slur/shared';
import { useSyncExternalStore } from 'react';
import { typingTarget } from '../../dev/typing-target';
import { loadSong, playSong, songAudio, songMs, stopSong } from './song-player';
import {
    emptyKeys,
    emptyTicks,
    INPUT_BITS,
    inputBits,
    pushKey,
    pushTick,
    TAKE_VERSION,
    type Take,
    type TakeEnd,
    type TakeSong,
} from './take-format';

export type DeckPhase = 'empty' | 'loading' | 'ready' | 'starting' | 'recording' | 'saving' | 'saved' | 'error';

export interface SavedTake {
    file: string;
    bytes: number;
    keys: number;
    ticks: number;
}

export interface DeckState {
    phase: DeckPhase;
    song: TakeSong | null;
    shipId: ShipId;
    message: string;
    saved: SavedTake | null;
}

export const deckCommand = { restart: false };

const listeners = new Set< () => void >();

let state: DeckState = { phase: 'empty', song: null, shipId: DEFAULT_SHIP, message: '', saved: null };
let keys = emptyKeys();
let ticks = emptyTicks();
let tick = 0;
let takeShip: ShipId = DEFAULT_SHIP;

function update( patch: Partial< DeckState > ): void {
    state = { ...state, ...patch };
    for ( const listener of listeners ) listener();
}

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function deckState(): DeckState {
    return state;
}

export function useDeckState(): DeckState {
    return useSyncExternalStore( subscribe, deckState, deckState );
}

export function recording(): boolean {
    return state.phase === 'recording';
}

function idle(): boolean {
    return state.phase === 'ready' || state.phase === 'saved' || state.phase === 'error';
}

export async function pickSong( file: File ): Promise< void > {
    if ( ! idle() && state.phase !== 'empty' ) return;
    update( { phase: 'loading', message: file.name, saved: null } );
    try {
        update( { phase: 'ready', song: await loadSong( file ), message: '' } );
    } catch ( e ) {
        update( { phase: 'error', song: null, message: `could not decode ${ file.name }: ${ String( e ) }` } );
    }
}

export function chooseShip( shipId: ShipId ): void {
    if ( recording() ) return;
    update( { shipId } );
}

async function startTake(): Promise< void > {
    if ( ! idle() || state.song === null ) return;
    update( { phase: 'starting', saved: null, message: '' } );
    keys = emptyKeys();
    ticks = emptyTicks();
    tick = 0;
    takeShip = state.shipId;
    try {
        await playSong( () => void stopTake( 'song-end' ) );
    } catch ( e ) {
        update( { phase: 'error', message: String( e ) } );
        return;
    }
    deckCommand.restart = true;
    update( { phase: 'recording' } );
}

export function recordTick( raw: PlayerInput, s: SimShip, perfNow: number ): void {
    if ( ! recording() ) return;
    pushTick( ticks, tick, songMs( perfNow ), inputBits( raw ), s );
    tick += 1;
}

function buildTake( song: TakeSong, end: TakeEnd ): Take {
    return {
        version: TAKE_VERSION,
        createdAt: new Date().toISOString(),
        song,
        shipId: takeShip,
        tuning: tuningForShip( takeShip ),
        simConfig: DEFAULT_SIM_CONFIG,
        dt: FIXED_DT,
        autoCruise: true,
        bits: INPUT_BITS,
        audio: songAudio(),
        end,
        keys,
        ticks,
    };
}

export async function stopTake( end: TakeEnd ): Promise< void > {
    if ( ! recording() || state.song === null ) return;
    stopSong();
    update( { phase: 'saving' } );
    const take = buildTake( state.song, end );
    try {
        const res = await fetch( '/__beat-deck/take', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify( take ),
        } );
        if ( ! res.ok ) throw new Error( await res.text() );
        const { file, bytes } = ( await res.json() ) as { file: string; bytes: number };
        update( { phase: 'saved', saved: { file, bytes, keys: keys.code.length, ticks: ticks.tick.length } } );
    } catch ( e ) {
        update( { phase: 'error', message: `take not saved: ${ String( e ) }` } );
    }
}

function logKey( e: KeyboardEvent, down: boolean ): void {
    if ( e.repeat || ! recording() ) return;
    pushKey( keys, songMs( e.timeStamp ), tick, e.code, down );
}

if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
    addEventListener( 'keydown', ( e ) => {
        if ( typingTarget( e.target ) ) return;
        if ( e.code === 'Enter' ) {
            void startTake();
            return;
        }
        if ( e.code === 'Escape' ) {
            void stopTake( 'esc' );
            return;
        }
        logKey( e, true );
    } );
    addEventListener( 'keyup', ( e ) => {
        if ( e.code === 'Enter' || e.code === 'Escape' ) return;
        logKey( e, false );
    } );
}
