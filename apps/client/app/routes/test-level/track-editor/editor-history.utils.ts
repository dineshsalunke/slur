import { HISTORY_CAP } from './track-editor.constants';

export interface EditorHistory< T > {
    past: readonly T[];
    future: readonly T[];
}

export interface HistoryStep< T > {
    history: EditorHistory< T >;
    present: T;
}

export type HistoryKey = 'undo' | 'redo';

export function emptyHistory< T >(): EditorHistory< T > {
    return { past: [], future: [] };
}

export function pushHistory< T >( history: EditorHistory< T >, present: T, next: T ): HistoryStep< T > {
    return { history: { past: [ ...history.past, present ].slice( -HISTORY_CAP ), future: [] }, present: next };
}

export function undoHistory< T extends object >( history: EditorHistory< T >, present: T ): HistoryStep< T > | null {
    const previous = history.past.at( -1 );
    if ( previous === undefined ) return null;
    return {
        history: { past: history.past.slice( 0, -1 ), future: [ present, ...history.future ] },
        present: previous,
    };
}

export function redoHistory< T extends object >( history: EditorHistory< T >, present: T ): HistoryStep< T > | null {
    const next = history.future[ 0 ];
    if ( next === undefined ) return null;
    return { history: { past: [ ...history.past, present ], future: history.future.slice( 1 ) }, present: next };
}

export function stepHistory< T extends object >(
    history: EditorHistory< T >,
    present: T,
    key: HistoryKey,
): HistoryStep< T > | null {
    return key === 'undo' ? undoHistory( history, present ) : redoHistory( history, present );
}

export function historyKeyOf(
    e: Pick< KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' >,
): HistoryKey | null {
    if ( e.altKey || ! ( e.metaKey || e.ctrlKey ) ) return null;
    const key = e.key.toLowerCase();
    if ( key === 'z' ) return e.shiftKey ? 'redo' : 'undo';
    return key === 'y' && e.ctrlKey && ! e.shiftKey ? 'redo' : null;
}
