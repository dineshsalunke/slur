import type { PointerEvent } from 'react';
import { press } from '../../../input/actions';
import { BINDINGS } from '../../../input/bindings';
import { pressJump, releasePointer } from '../../../input/touch-state';
import { noMenu } from '../touch-pad.utils';
import { ARM } from './touch-dpad.constants';
import { dpadHeld } from './touch-dpad.state';
import { type DpadZone, dpadZone } from './touch-dpad.utils';

export function TouchDpad() {
    const light = ( pad: HTMLElement, zone: DpadZone, on: boolean ) => {
        const el = pad.querySelector< HTMLElement >( `[data-zone="${ zone }"]` );
        if ( ! el ) return;
        if ( on ) el.dataset.on = '';
        else if ( ! [ ...dpadHeld.values() ].includes( zone ) ) delete el.dataset.on;
    };
    const leave = ( pad: HTMLElement, pointerId: number ) => {
        const was = dpadHeld.get( pointerId );
        if ( ! was ) return;
        dpadHeld.delete( pointerId );
        if ( was === 'jump' ) releasePointer( pointerId );
        light( pad, was, false );
    };
    const track = ( e: PointerEvent< HTMLDivElement > ) => {
        const pad = e.currentTarget;
        const rect = pad.getBoundingClientRect();
        const r = rect.width / 2;
        const zone = dpadZone( e.clientX - rect.left - r, e.clientY - rect.top - r, r );
        if ( zone === ( dpadHeld.get( e.pointerId ) ?? null ) ) return;
        leave( pad, e.pointerId );
        if ( ! zone ) return;
        dpadHeld.set( e.pointerId, zone );
        if ( zone === 'jump' ) pressJump( e.pointerId );
        else press( BINDINGS.touch[ zone ] );
        light( pad, zone, true );
    };
    const down = ( e: PointerEvent< HTMLDivElement > ) => {
        e.currentTarget.setPointerCapture( e.pointerId );
        track( e );
    };
    const move = ( e: PointerEvent< HTMLDivElement > ) => {
        if ( e.currentTarget.hasPointerCapture( e.pointerId ) ) track( e );
    };
    const up = ( e: PointerEvent< HTMLDivElement > ) => leave( e.currentTarget, e.pointerId );

    return (
        <div
            aria-label="Power-ups and jump: centre jumps, up fires, down fires back, left and right switch power-up"
            role="application"
            onPointerDown={ down }
            onPointerMove={ move }
            onPointerUp={ up }
            onPointerCancel={ up }
            onLostPointerCapture={ up }
            onContextMenu={ noMenu }
            className="pointer-events-auto absolute right-[max(20px,env(safe-area-inset-right))] bottom-[calc(84px_+_env(safe-area-inset-bottom))] size-[216px] touch-none select-none rounded-full border-2 border-readout/25 bg-deep/35 [-webkit-touch-callout:none]"
        >
            <span data-zone="up" className={ `${ ARM } inset-x-0 top-3` }>
                Fire
            </span>
            <span data-zone="down" className={ `${ ARM } inset-x-0 bottom-3` }>
                Back
            </span>
            <span data-zone="left" className={ `${ ARM } inset-y-0 left-4 text-[18px]` }>
                ‹
            </span>
            <span data-zone="right" className={ `${ ARM } inset-y-0 right-4 text-[18px]` }>
                ›
            </span>
            <span
                data-zone="jump"
                className={ `${ ARM } top-1/2 left-1/2 size-[90px] -translate-1/2 rounded-full border-2 border-readout/40 bg-deep/45 data-on:border-marigold data-on:bg-marigold/30` }
            >
                Jump
            </span>
        </div>
    );
}
