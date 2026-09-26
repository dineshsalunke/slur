import type { PointerEvent } from 'react';
import { synthKey } from '../../input/synth-key';
import { pressTouch, type TouchControl } from '../../input/touch-state';
import { BASE } from './touch-button.constants';
import { lift, noMenu } from './touch-button.utils';

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
