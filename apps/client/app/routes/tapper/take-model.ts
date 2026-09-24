import type { NoteToken } from '@slur/shared';
import { type Grid, gridAt } from './song-grid';
import type { RawNote } from './tap-gestures';

export interface TapNote {
    t: number;
    beat: number;
    bar: number;
    beatInBar: number;
    token: NoteToken;
    heldBeats?: number;
}

export interface Punch {
    fromBar: number;
    toBar: number;
    rate: number;
}

export interface Take {
    id: number;
    song: string;
    base: number | null;
    fromBar: number;
    toBar: number;
    punches: Punch[];
    notes: TapNote[];
}

const r3 = ( x: number ) => Math.round( x * 1000 ) / 1000;

export function placeNotes( g: Grid, raw: readonly RawNote[], fromBar: number ): TapNote[] {
    return raw.map( ( n ) => {
        const pos = gridAt( g, n.t );
        const note: TapNote = {
            t: r3( n.t ),
            beat: r3( pos.beat ),
            bar: Math.max( fromBar, pos.bar ),
            beatInBar: r3( pos.bar < fromBar ? pos.beatInBar - g.beatsPerBar : pos.beatInBar ),
            token: n.token,
        };
        if ( n.held !== undefined ) note.heldBeats = r3( ( n.held * g.bpm ) / 60 );
        return note;
    } );
}

export function punchIn( base: readonly TapNote[], fresh: readonly TapNote[], p: Punch ): TapNote[] {
    const inside = ( n: TapNote ) => n.bar >= p.fromBar && n.bar < p.toBar;
    return [ ...base.filter( ( n ) => ! inside( n ) ), ...fresh.filter( inside ) ].sort( ( a, b ) => a.t - b.t );
}

export function nextTake( takes: readonly Take[], base: Take | null, song: string, fresh: TapNote[], p: Punch ): Take {
    const id = takes.reduce( ( m, t ) => Math.max( m, t.id ), 0 ) + 1;
    const useBase = base && base.song === song ? base : null;
    return {
        id,
        song,
        base: useBase?.id ?? null,
        fromBar: Math.min( p.fromBar, useBase?.fromBar ?? p.fromBar ),
        toBar: Math.max( p.toBar, useBase?.toBar ?? p.toBar ),
        punches: [ ...( useBase?.punches ?? [] ), p ],
        notes: punchIn( useBase?.notes ?? [], fresh, p ),
    };
}
