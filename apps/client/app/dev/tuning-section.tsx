import { useState } from 'react';
import type { ChoiceKey, ColorKey, NumberKey } from './tunables';
import { TuningChoice } from './tuning-choice';
import { TuningColor } from './tuning-color';
import { TuningNumber } from './tuning-number';

export type TuningRow =
    | { kind: 'number'; key: NumberKey }
    | { kind: 'color'; key: ColorKey }
    | { kind: 'choice'; key: ChoiceKey };

const STORAGE_KEY = 'slur.tuning.collapsed';

const collapsed = new Set< string >();

function restore(): void {
    try {
        const raw = localStorage.getItem( STORAGE_KEY );
        if ( ! raw ) return;
        const saved = JSON.parse( raw ) as unknown;
        if ( ! Array.isArray( saved ) ) return;
        for ( const group of saved ) if ( typeof group === 'string' ) collapsed.add( group );
    } catch {
        return;
    }
}

function persist(): void {
    try {
        localStorage.setItem( STORAGE_KEY, JSON.stringify( [ ...collapsed ] ) );
    } catch {
        return;
    }
}

restore();

export function TuningSection( { group, rows }: { group: string; rows: TuningRow[] } ) {
    const [ open, setOpen ] = useState( ! collapsed.has( group ) );
    const toggle = () => {
        if ( collapsed.has( group ) ) collapsed.delete( group );
        else collapsed.add( group );
        persist();
        setOpen( ( v ) => ! v );
    };

    return (
        <section>
            <button
                type="button"
                className="mt-2 flex w-full items-center gap-1 border-neutral-800 border-b pb-0.5 text-[10px] text-amber-400 uppercase tracking-wider"
                onClick={ toggle }
            >
                <span className="w-2 text-neutral-500">{ open ? '−' : '+' }</span>
                <span className="flex-1 text-left">{ group }</span>
                <span className="text-neutral-600 normal-case">{ open ? '' : `${ rows.length }` }</span>
            </button>
            { open
                ? rows.map( ( row ) => {
                      if ( row.kind === 'number' ) return <TuningNumber key={ row.key } tunable={ row.key } />;
                      if ( row.kind === 'color' ) return <TuningColor key={ row.key } tunable={ row.key } />;
                      return <TuningChoice key={ row.key } tunable={ row.key } />;
                  } )
                : null }
        </section>
    );
}
