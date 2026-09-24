import { createStore } from './external-store';
import { nextTake, type Punch, type Take, type TapNote } from './take-model';

export interface TakesState {
    takes: Take[];
    selected: number | null;
}

const KEY = 'slur.tapper.takes';
const MAX_UNDO = 50;

function load(): TakesState {
    try {
        const raw = localStorage.getItem( KEY );
        if ( raw ) return JSON.parse( raw ) as TakesState;
    } catch {}
    return { takes: [], selected: null };
}

export const takesStore = createStore< TakesState >(
    typeof localStorage === 'undefined' ? { takes: [], selected: null } : load(),
);
const history: TakesState[] = [];

function commit( next: TakesState ): void {
    history.push( takesStore.get() );
    if ( history.length > MAX_UNDO ) history.shift();
    takesStore.set( next );
    try {
        localStorage.setItem( KEY, JSON.stringify( next ) );
    } catch {}
}

export function selectedTake(): Take | null {
    const { takes, selected } = takesStore.get();
    return takes.find( ( t ) => t.id === selected ) ?? null;
}

export function recordTake( song: string, fresh: TapNote[], p: Punch ): void {
    const { takes } = takesStore.get();
    const take = nextTake( takes, selectedTake(), song, fresh, p );
    commit( { takes: [ ...takes, take ], selected: take.id } );
}

export function selectTake( id: number | null ): void {
    takesStore.set( { ...takesStore.get(), selected: id } );
}

export function deleteTake( id: number ): void {
    const s = takesStore.get();
    commit( { takes: s.takes.filter( ( t ) => t.id !== id ), selected: s.selected === id ? null : s.selected } );
}

export function undo(): void {
    const prev = history.pop();
    if ( ! prev ) return;
    takesStore.set( prev );
    try {
        localStorage.setItem( KEY, JSON.stringify( prev ) );
    } catch {}
}

export function exportTakes( meta: { song: string; bpm: number; beatsPerBar: number } | null ): void {
    const body = JSON.stringify( { exportedAt: new Date().toISOString(), meta, ...takesStore.get() }, null, 1 );
    const a = document.createElement( 'a' );
    a.href = URL.createObjectURL( new Blob( [ body ], { type: 'application/json' } ) );
    a.download = `tapper-takes-${ Date.now() }.json`;
    a.click();
    URL.revokeObjectURL( a.href );
}
