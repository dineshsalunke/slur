import { emptyInput } from '@slur/shared';
import { latchJump } from './jump-latch';

export type TouchControl = 'left' | 'right' | 'throttle' | 'brake' | 'jump';

const input = emptyInput();
const held = new Map< number, TouchControl >();

export const touchInput: Readonly< typeof input > = input;

function recompute(): void {
    let left = false;
    let right = false;
    input.throttle = 0;
    input.brake = 0;
    input.jump = false;
    for ( const control of held.values() ) {
        if ( control === 'throttle' ) input.throttle = 1;
        else if ( control === 'brake' ) input.brake = 1;
        else if ( control === 'jump' ) input.jump = true;
        else if ( control === 'left' ) left = true;
        else right = true;
    }
    input.strafe = ( left ? 1 : 0 ) - ( right ? 1 : 0 );
}

export function pressTouch( control: TouchControl, pointerId: number ): void {
    if ( control === 'jump' && ! input.jump ) latchJump();
    held.set( pointerId, control );
    recompute();
}

export function releasePointer( pointerId: number ): void {
    if ( ! held.delete( pointerId ) ) return;
    recompute();
}

export function releaseAllTouch(): void {
    held.clear();
    recompute();
}

if ( typeof window !== 'undefined' ) {
    const release = ( e: PointerEvent ) => releasePointer( e.pointerId );
    addEventListener( 'pointerup', release, true );
    addEventListener( 'pointercancel', release, true );
    addEventListener( 'blur', releaseAllTouch );
}
