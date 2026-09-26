import { emptyInput } from '@slur/shared';
import { gamepadInput } from './gamepad';
import { takeJumpLatch } from './jump-latch';
import { keyboardInput } from './keyboard';
import { touchInput } from './touch-state';

const SOURCES = [ keyboardInput, touchInput, gamepadInput ];

const input = emptyInput();
let seq = 0;

export function lastInputSeq(): number {
    return seq;
}

export function currentInput() {
    input.seq = ++seq;
    input.throttle = 0;
    input.brake = 0;
    let strafe = 0;
    let jump = takeJumpLatch();
    for ( const s of SOURCES ) {
        input.throttle = Math.max( input.throttle, s.throttle );
        input.brake = Math.max( input.brake, s.brake );
        strafe += s.strafe;
        jump ||= s.jump;
    }
    input.strafe = Math.max( -1, Math.min( 1, strafe ) );
    input.jump = jump;
    return input;
}
