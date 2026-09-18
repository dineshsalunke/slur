import { Fragment, useState } from 'react';
import { REFERENCE_BOARDS, SCALE_TRUST_NOTE } from './reference-boards';
import type { OverlayMode } from './reference-overlay';

const MODES: readonly { id: OverlayMode; label: string; hint: string }[] = [
    { id: 'off', label: 'Off', hint: 'render only' },
    { id: 'blend', label: 'Blend', hint: 'board over render — slider = opacity' },
    { id: 'split', label: 'Split', hint: 'side by side — slider = render pane width' },
    { id: 'wipe', label: 'Wipe', hint: 'board clipped over render — slider = wipe position' },
];

export interface IsoLabControlsProps {
    title: string;
    mode: OverlayMode;
    onMode: ( m: OverlayMode ) => void;
    boardId: string;
    onBoard: ( id: string ) => void;
    t: number;
    onT: ( v: number ) => void;
    bloom: boolean;
    onBloom: ( v: boolean ) => void;
    grid: boolean;
    onGrid: ( v: boolean ) => void;
    size: number;
}

const BTN = 'rounded px-2 py-1 text-xs transition-colors';

/**
 * The lab's DOM control panel. Tailwind v4 only — no inline style objects, no vanilla CSS (PR #85's lesson).
 *
 * Collapsible, because the panel occludes exactly the corner of the frame you want to compare against a
 * board. Collapsed-by-default was rejected: an instrument whose controls are hidden gets used as a static
 * screenshot, which is the failure mode this route exists to replace.
 */
export function IsoLabControls( props: IsoLabControlsProps ) {
    const [ open, setOpen ] = useState( true );
    const board = REFERENCE_BOARDS.find( ( b ) => b.id === props.boardId );

    if ( ! open ) {
        return (
            <button
                type="button"
                onClick={ () => setOpen( true ) }
                className={ `absolute top-3 left-3 z-30 bg-slate-900/90 text-slate-200 ${ BTN }` }
            >
                ▸ { props.title }
            </button>
        );
    }

    return (
        <div className="absolute top-3 left-3 z-30 w-72 space-y-3 rounded-lg bg-slate-950/90 p-3 text-slate-200 ring-1 ring-slate-700">
            <div className="flex items-center justify-between">
                <h1 className="text-sm font-semibold tracking-wide">{ props.title }</h1>
                <button type="button" onClick={ () => setOpen( false ) } className={ `bg-slate-800 ${ BTN }` }>
                    ▾ hide
                </button>
            </div>

            <p className="text-[11px] text-slate-400">
                Subject framed at <span className="text-slate-200">{ props.size }u</span> · ruler rung = 64u = one track
                width · cyan box = Fighter footprint (2.6u)
            </p>

            <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Reference board</div>
                <select
                    value={ props.boardId }
                    onChange={ ( e ) => props.onBoard( e.target.value ) }
                    className="w-full rounded bg-slate-800 px-2 py-1 text-xs"
                >
                    { REFERENCE_BOARDS.map( ( b ) => (
                        <option key={ b.id } value={ b.id }>
                            { b.name }
                        </option>
                    ) ) }
                </select>
                { board ? (
                    <p
                        className={ `mt-1 text-[11px] ${
                            board.scaleTrust === 'undersized' ? 'text-red-300' : 'text-slate-400'
                        }` }
                    >
                        { SCALE_TRUST_NOTE[ board.scaleTrust ] }
                    </p>
                ) : (
                    <Fragment />
                ) }
            </div>

            <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Compare mode</div>
                <div className="grid grid-cols-4 gap-1">
                    { MODES.map( ( m ) => (
                        <button
                            key={ m.id }
                            type="button"
                            title={ m.hint }
                            onClick={ () => props.onMode( m.id ) }
                            className={ `${ BTN } ${
                                props.mode === m.id ? 'bg-[#F59A24] text-slate-950' : 'bg-slate-800'
                            }` }
                        >
                            { m.label }
                        </button>
                    ) ) }
                </div>
            </div>

            { props.mode === 'off' ? (
                <Fragment />
            ) : (
                <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                        { props.mode === 'blend' ? 'Board opacity' : 'Divider' } · { Math.round( props.t * 100 ) }%
                    </span>
                    <input
                        type="range"
                        min={ 0 }
                        max={ 1 }
                        step={ 0.01 }
                        value={ props.t }
                        onChange={ ( e ) => props.onT( Number( e.target.value ) ) }
                        className="mt-1 w-full accent-[#F59A24]"
                    />
                </label>
            ) }

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={ () => props.onBloom( ! props.bloom ) }
                    className={ `${ BTN } ${ props.bloom ? 'bg-[#F59A24] text-slate-950' : 'bg-slate-800' }` }
                >
                    Bloom
                </button>
                <button
                    type="button"
                    onClick={ () => props.onGrid( ! props.grid ) }
                    className={ `${ BTN } ${ props.grid ? 'bg-[#F59A24] text-slate-950' : 'bg-slate-800' }` }
                >
                    Grid
                </button>
            </div>
        </div>
    );
}
