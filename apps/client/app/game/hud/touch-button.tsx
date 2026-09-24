import type { MouseEvent, PointerEvent } from 'react';
import { synthKey } from '../input/synth-key';
import { pressTouch, type TouchControl } from '../input/touch-state';

const BASE =
    'pointer-events-auto flex touch-none select-none items-center justify-center rounded-full border-2 border-readout/35 bg-deep/45 font-readout text-[11px] font-semibold uppercase tracking-[0.15em] text-readout [-webkit-touch-callout:none] data-on:border-marigold data-on:bg-marigold/30';

const lift = ( e: PointerEvent< HTMLButtonElement > ) => {
    delete e.currentTarget.dataset.on;
};
const noMenu = ( e: MouseEvent ) => e.preventDefault();

export function TouchButton( {
    name,
    label,
    control,
    code,
    className,
}: {
    name: string;
    label: string;
    control?: TouchControl;
    code?: string;
    className: string;
} ) {
    const down = ( e: PointerEvent< HTMLButtonElement > ) => {
        e.currentTarget.dataset.on = '';
        if ( control ) pressTouch( control, e.pointerId );
        if ( code ) synthKey( code );
    };
    return (
        <button
            type="button"
            aria-label={ name }
            onPointerDown={ down }
            onPointerUp={ lift }
            onPointerCancel={ lift }
            onLostPointerCapture={ lift }
            onContextMenu={ noMenu }
            className={ `${ className } ${ BASE }` }
        >
            { label }
        </button>
    );
}
