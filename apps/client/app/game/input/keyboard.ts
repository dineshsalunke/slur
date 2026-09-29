import { emptyInput } from '@slur/shared';
import { typingTarget } from '../../dev/typing-target';
import { type Action, press } from './actions';
import { BINDINGS } from './bindings';
import { latchJump } from './jump-latch';

export const THROTTLE_KEY = 'ArrowUp';
export const BRAKE_KEY = 'ArrowDown';
export const STRAFE_LEFT_KEY = 'ArrowLeft';
export const STRAFE_RIGHT_KEY = 'ArrowRight';
export const JUMP_KEY = 'Space';

const input = emptyInput();
const down = new Set< string >();

export const keyboardInput: Readonly< typeof input > = input;

function recompute(): void {
    input.throttle = down.has( THROTTLE_KEY ) ? 1 : 0;
    input.brake = down.has( BRAKE_KEY ) ? 1 : 0;
    input.strafe = ( down.has( STRAFE_LEFT_KEY ) ? 1 : 0 ) - ( down.has( STRAFE_RIGHT_KEY ) ? 1 : 0 );
    input.jump = down.has( JUMP_KEY );
}

export function keyAction( e: KeyboardEvent ): Action | null {
    if ( e.repeat || e.metaKey || e.ctrlKey || e.altKey || typingTarget( e.target ) ) return null;
    return BINDINGS.keyboard[ e.code ] ?? null;
}

export function attachKeyboard(): () => void {
    const on = ( e: KeyboardEvent ) => {
        if ( e.code === JUMP_KEY && ! down.has( JUMP_KEY ) ) latchJump();
        down.add( e.code );
        recompute();
        const action = keyAction( e );
        if ( action ) press( action );
    };
    const off = ( e: KeyboardEvent ) => {
        down.delete( e.code );
        recompute();
    };
    const releaseAll = () => {
        down.clear();
        recompute();
    };
    const onVisibility = () => {
        if ( document.hidden ) releaseAll();
    };
    addEventListener( 'keydown', on );
    addEventListener( 'keyup', off );
    addEventListener( 'blur', releaseAll );
    document.addEventListener( 'visibilitychange', onVisibility );
    document.addEventListener( 'fullscreenchange', releaseAll );
    return () => {
        removeEventListener( 'keydown', on );
        removeEventListener( 'keyup', off );
        removeEventListener( 'blur', releaseAll );
        document.removeEventListener( 'visibilitychange', onVisibility );
        document.removeEventListener( 'fullscreenchange', releaseAll );
    };
}
