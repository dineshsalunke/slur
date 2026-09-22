import { useEffect, useState } from 'react';
import { FpsReadout } from './fps-readout';
import {
    CHOICE_SPECS,
    type ChoiceKey,
    COLOR_SPECS,
    type ColorKey,
    NUMBER_SPECS,
    type NumberKey,
    resetTunables,
    tunablesSnapshot,
} from './tunables';
import { type TuningRow, TuningSection } from './tuning-section';

function groupRows(): [ string, TuningRow[] ][] {
    const groups = new Map< string, TuningRow[] >();
    const push = ( group: string, row: TuningRow ) => {
        const bucket = groups.get( group );
        if ( bucket ) bucket.push( row );
        else groups.set( group, [ row ] );
    };
    for ( const key of Object.keys( NUMBER_SPECS ) as NumberKey[] ) {
        push( NUMBER_SPECS[ key ].group, { kind: 'number', key } );
    }
    for ( const key of Object.keys( COLOR_SPECS ) as ColorKey[] ) {
        push( COLOR_SPECS[ key ].group, { kind: 'color', key } );
    }
    for ( const key of Object.keys( CHOICE_SPECS ) as ChoiceKey[] ) {
        push( CHOICE_SPECS[ key ].group, { kind: 'choice', key } );
    }
    return [ ...groups ];
}

const ROWS = groupRows();

export function TuningPanel() {
    const [ open, setOpen ] = useState( true );

    // JUSTIFIED EFFECT — syncs with an external system: the DOM keyboard (window keydown) that owns the panel toggle.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code !== 'Backquote' ) return;
            const target = e.target as HTMLElement | null;
            if ( target?.tagName === 'INPUT' || target?.tagName === 'SELECT' ) return;
            setOpen( ( v ) => ! v );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

    if ( ! open ) {
        return (
            <button
                type="button"
                className="fixed top-2 right-2 z-50 rounded border border-neutral-700 bg-neutral-950/80 px-2 py-1 font-mono text-[11px] text-neutral-400"
                onClick={ () => setOpen( true ) }
            >
                tune `
            </button>
        );
    }

    return (
        <div className="fixed top-2 right-2 z-50 max-h-[calc(100vh-1rem)] w-80 overflow-y-auto rounded border border-neutral-700 bg-neutral-950 p-2 font-mono text-neutral-300">
            <div className="mb-1 flex items-center gap-2 text-[11px]">
                <FpsReadout />
                <span className="flex-1 text-neutral-500">` to hide</span>
                <button
                    type="button"
                    className="rounded border border-neutral-700 px-1 text-neutral-400"
                    onClick={ () => navigator.clipboard.writeText( tunablesSnapshot() ) }
                >
                    copy
                </button>
                <button
                    type="button"
                    className="rounded border border-neutral-700 px-1 text-neutral-400"
                    onClick={ resetTunables }
                >
                    reset
                </button>
            </div>
            { ROWS.map( ( [ group, rows ] ) => (
                <TuningSection key={ group } group={ group } rows={ rows } />
            ) ) }
        </div>
    );
}
