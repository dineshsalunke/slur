import type { NoteToken } from '@slur/shared';

export const DOUBLE_TAP_MS = 250;

export interface KeyEvt {
    code: string;
    shift: boolean;
    down: boolean;
    t: number;
    ms: number;
}

export interface RawNote {
    t: number;
    token: NoteToken;
    held?: number;
}

const STEER: Record< string, { tap: NoteToken; wide: NoteToken; hold: NoteToken } > = {
    KeyA: { tap: 'l', wide: 'L', hold: '<' },
    KeyD: { tap: 'r', wide: 'R', hold: '>' },
};

export interface Gestures {
    feed( e: KeyEvt ): void;
    flush( t: number ): void;
    notes(): RawNote[];
}

export function createGestures( holdS: number, doubleMs = DOUBLE_TAP_MS ): Gestures {
    const out: RawNote[] = [];
    const pending = new Map< string, { t: number; shift: boolean } >();
    let lastJump: { note: RawNote; ms: number } | null = null;

    const release = ( code: string, t: number ) => {
        const p = pending.get( code );
        if ( ! p ) return;
        pending.delete( code );
        const keys = STEER[ code ];
        const dur = t - p.t;
        if ( dur >= holdS ) out.push( { t: p.t, token: keys.hold, held: dur } );
        else out.push( { t: p.t, token: p.shift ? keys.wide : keys.tap } );
    };

    const jump = ( e: KeyEvt ) => {
        if ( lastJump && lastJump.note.token === 'J' && e.ms - lastJump.ms <= doubleMs ) {
            lastJump.note.token = 'JJ';
            lastJump = null;
            return;
        }
        const note: RawNote = { t: e.t, token: 'J' };
        out.push( note );
        lastJump = { note, ms: e.ms };
    };

    return {
        feed( e ) {
            if ( STEER[ e.code ] ) {
                if ( e.down ) pending.set( e.code, { t: e.t, shift: e.shift } );
                else release( e.code, e.t );
            } else if ( e.down && e.code === 'Space' ) jump( e );
            else if ( e.down && e.code === 'KeyS' ) out.push( { t: e.t, token: 'S' } );
        },
        flush( t ) {
            for ( const code of [ ...pending.keys() ] ) release( code, t );
        },
        notes() {
            return [ ...out ].sort( ( a, b ) => a.t - b.t );
        },
    };
}
