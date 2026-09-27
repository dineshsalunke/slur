import type { AuthoredLevel } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    emptyHistory,
    type HistoryStep,
    historyKeyOf,
    pushHistory,
    redoHistory,
    stepHistory,
    undoHistory,
} from './editor-history.utils';
import { HISTORY_CAP } from './track-editor.constants';
import { applyTool } from './track-editor.utils';

function level( over: Partial< AuthoredLevel > = {} ): AuthoredLevel {
    return {
        version: 1,
        id: 't',
        name: 't',
        length: 50,
        source: null,
        savedAt: '',
        blocks: [],
        gaps: [],
        ...over,
    };
}

function keys( key: string, mods: { meta?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean } = {} ) {
    return {
        key,
        metaKey: mods.meta ?? false,
        ctrlKey: mods.ctrl ?? false,
        shiftKey: mods.shift ?? false,
        altKey: mods.alt ?? false,
    };
}

describe( 'editor history', () => {
    const a = { n: 1 };
    const b = { n: 2 };
    const c = { n: 3 };

    it( 'undo and redo walk back and forth through pushed states', () => {
        const one = pushHistory( emptyHistory< typeof a >(), a, b );
        const two = pushHistory( one.history, one.present, c );
        const back = undoHistory( two.history, two.present ) as HistoryStep< typeof a >;
        expect( back.present ).toBe( b );
        const start = undoHistory( back.history, back.present ) as HistoryStep< typeof a >;
        expect( start.present ).toBe( a );
        expect( undoHistory( start.history, start.present ) ).toBeNull();
        const again = redoHistory( start.history, start.present ) as HistoryStep< typeof a >;
        expect( again.present ).toBe( b );
        expect( redoHistory( again.history, again.present )?.present ).toBe( c );
    } );

    it( 'a new change drops the redo states', () => {
        const one = pushHistory( emptyHistory< typeof a >(), a, b );
        const back = undoHistory( one.history, one.present ) as HistoryStep< typeof a >;
        const fork = pushHistory( back.history, back.present, c );
        expect( fork.history.future ).toHaveLength( 0 );
        expect( redoHistory( fork.history, fork.present ) ).toBeNull();
    } );

    it( 'stepHistory picks undo or redo by key', () => {
        const one = pushHistory( emptyHistory< typeof a >(), a, b );
        const back = stepHistory( one.history, one.present, 'undo' ) as HistoryStep< typeof a >;
        expect( back.present ).toBe( a );
        expect( stepHistory( back.history, back.present, 'redo' )?.present ).toBe( b );
    } );

    it( 'keeps only the newest HISTORY_CAP states', () => {
        let step: HistoryStep< { n: number } > = { history: emptyHistory(), present: { n: 0 } };
        for ( let n = 1; n <= HISTORY_CAP + 50; n++ ) step = pushHistory( step.history, step.present, { n } );
        expect( step.history.past ).toHaveLength( HISTORY_CAP );
        expect( step.history.past[ 0 ]?.n ).toBe( 50 );
    } );

    it( 'undo after an erase that split a block gives back the whole block', () => {
        const whole = level( { blocks: [ { x: -8, z: 200, w: 16, l: 16, destructible: true } ] } );
        const cut = applyTool( whole, 'eraser', { x: -8, z: 206, w: 16, l: 4 } );
        expect( cut.blocks ).toHaveLength( 2 );
        const step = pushHistory( emptyHistory< AuthoredLevel >(), whole, cut );
        expect( undoHistory( step.history, step.present )?.present.blocks ).toEqual( whole.blocks );
    } );
} );

describe( 'historyKeyOf', () => {
    it( 'maps Cmd/Ctrl+Z to undo and Shift+Cmd/Ctrl+Z or Ctrl+Y to redo', () => {
        expect( historyKeyOf( keys( 'z', { meta: true } ) ) ).toBe( 'undo' );
        expect( historyKeyOf( keys( 'z', { ctrl: true } ) ) ).toBe( 'undo' );
        expect( historyKeyOf( keys( 'Z', { meta: true, shift: true } ) ) ).toBe( 'redo' );
        expect( historyKeyOf( keys( 'Z', { ctrl: true, shift: true } ) ) ).toBe( 'redo' );
        expect( historyKeyOf( keys( 'y', { ctrl: true } ) ) ).toBe( 'redo' );
    } );

    it( 'ignores plain keys, Cmd+Y and Alt chords', () => {
        expect( historyKeyOf( keys( 'z' ) ) ).toBeNull();
        expect( historyKeyOf( keys( 'y', { meta: true } ) ) ).toBeNull();
        expect( historyKeyOf( keys( 'z', { meta: true, alt: true } ) ) ).toBeNull();
        expect( historyKeyOf( keys( 's', { meta: true } ) ) ).toBeNull();
    } );
} );
