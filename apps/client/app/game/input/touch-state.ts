import { emptyInput } from '@slur/shared';
import { latchJump } from './jump-latch';
import { BRAKE_OFF, BRAKE_ON, latchAxis, STRAFE_OFF, STRAFE_ON } from './touch-latch';

const NO_POINTER = -1;

const input = emptyInput();
const jumps = new Set< number >();
const stick = { pointerId: NO_POINTER, side: 0, brake: 0 };

export const touchInput: Readonly< typeof input > = input;

function recompute(): void {
    const held = stick.pointerId !== NO_POINTER;
    input.brake = held ? stick.brake : 0;
    input.throttle = held && stick.brake === 0 ? 1 : 0;
    input.strafe = held ? -stick.side : 0;
    input.jump = jumps.size > 0;
}

export function holdStick( pointerId: number ): boolean {
    if ( stick.pointerId !== NO_POINTER ) return false;
    stick.pointerId = pointerId;
    stick.side = 0;
    stick.brake = 0;
    recompute();
    return true;
}

export function moveStick( pointerId: number, x: number, y: number ): void {
    if ( pointerId !== stick.pointerId ) return;
    stick.side = latchAxis( stick.side, x, STRAFE_ON, STRAFE_OFF );
    stick.brake = latchAxis( stick.brake, Math.max( 0, y ), BRAKE_ON, BRAKE_OFF );
    recompute();
}

export function pressJump( pointerId: number ): void {
    if ( jumps.size === 0 ) latchJump();
    jumps.add( pointerId );
    recompute();
}

export function releasePointer( pointerId: number ): void {
    const wasStick = pointerId === stick.pointerId;
    if ( wasStick ) stick.pointerId = NO_POINTER;
    if ( jumps.delete( pointerId ) || wasStick ) recompute();
}

export function releaseAllTouch(): void {
    jumps.clear();
    stick.pointerId = NO_POINTER;
    recompute();
}

if ( typeof window !== 'undefined' ) {
    const release = ( e: PointerEvent ) => releasePointer( e.pointerId );
    addEventListener( 'pointerup', release, true );
    addEventListener( 'pointercancel', release, true );
    addEventListener( 'blur', releaseAllTouch );
    document.addEventListener( 'fullscreenchange', releaseAllTouch );
}
