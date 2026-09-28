import type { PointerEvent } from 'react';
import { holdStick, moveStick, releasePointer } from '../../../input/touch-state';
import { noMenu } from '../touch-pad.utils';
import { STICK_RADIUS } from './touch-stick.constants';
import { stickOrigin } from './touch-stick.state';
import { stickVector } from './touch-stick.utils';

export function TouchStick() {
    const down = ( e: PointerEvent< HTMLDivElement > ) => {
        if ( ! holdStick( e.pointerId ) ) return;
        const zone = e.currentTarget;
        zone.setPointerCapture( e.pointerId );
        const rect = zone.getBoundingClientRect();
        stickOrigin.pointerId = e.pointerId;
        stickOrigin.x = e.clientX;
        stickOrigin.y = e.clientY;
        zone.style.setProperty( '--bx', `${ e.clientX - rect.left }px` );
        zone.style.setProperty( '--by', `${ e.clientY - rect.top }px` );
        zone.dataset.on = '';
    };
    const move = ( e: PointerEvent< HTMLDivElement > ) => {
        if ( e.pointerId !== stickOrigin.pointerId ) return;
        const v = stickVector( e.clientX - stickOrigin.x, e.clientY - stickOrigin.y, STICK_RADIUS );
        moveStick( e.pointerId, v.x, v.y );
        e.currentTarget.style.setProperty( '--kx', `${ v.x * STICK_RADIUS }px` );
        e.currentTarget.style.setProperty( '--ky', `${ v.y * STICK_RADIUS }px` );
    };
    const up = ( e: PointerEvent< HTMLDivElement > ) => {
        if ( e.pointerId !== stickOrigin.pointerId ) return;
        releasePointer( e.pointerId );
        stickOrigin.pointerId = -1;
        const zone = e.currentTarget;
        for ( const name of [ '--bx', '--by', '--kx', '--ky' ] ) zone.style.removeProperty( name );
        delete zone.dataset.on;
    };

    return (
        <div
            aria-label="Thrust and steer: touch to thrust, slide left or right to strafe, pull down to brake"
            role="application"
            onPointerDown={ down }
            onPointerMove={ move }
            onPointerUp={ up }
            onPointerCancel={ up }
            onLostPointerCapture={ up }
            onContextMenu={ noMenu }
            className="group pointer-events-auto absolute bottom-0 left-0 h-[70%] w-[45%] touch-none select-none [-webkit-touch-callout:none]"
        >
            <div className="absolute top-[var(--by,calc(100%_-_150px))] left-[var(--bx,max(96px,calc(env(safe-area-inset-left)_+_76px)))] size-[112px] -translate-1/2 rounded-full border-2 border-readout/30 bg-deep/35 group-data-on:border-marigold/70">
                <div className="absolute top-[calc(50%_+_var(--ky,0px))] left-[calc(50%_+_var(--kx,0px))] size-12 -translate-1/2 rounded-full border-2 border-readout/50 bg-readout/15 group-data-on:border-marigold group-data-on:bg-marigold/30" />
            </div>
        </div>
    );
}
