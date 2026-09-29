import { emptyInput } from '@slur/shared';
import { typingTarget } from '../../dev/typing-target';
import { latchJump } from './jump-latch';

export const THROTTLE_KEY = 'KeyQ';
export const BRAKE_KEY = 'KeyA';
export const BRAKE_ARROW_KEY = 'ArrowDown';
export const STRAFE_LEFT_KEY = 'ArrowLeft';
export const STRAFE_RIGHT_KEY = 'ArrowRight';
export const JUMP_KEY = 'Space';

const THROTTLE_KEYS = [ THROTTLE_KEY, 'KeyW' ];
const BRAKE_KEYS = [ BRAKE_KEY, 'KeyS', BRAKE_ARROW_KEY ];
const DRIVE_KEYS = new Set( [ ...THROTTLE_KEYS, ...BRAKE_KEYS, STRAFE_LEFT_KEY, STRAFE_RIGHT_KEY, JUMP_KEY ] );

const input = emptyInput();
const down = new Set< string >();
const has = ( codes: readonly string[] ) => codes.some( ( c ) => down.has( c ) );

export const keyboardInput: Readonly< typeof input > = input;

function recompute(): void {
    input.throttle = has( THROTTLE_KEYS ) ? 1 : 0;
    input.brake = has( BRAKE_KEYS ) ? 1 : 0;
    input.strafe = ( down.has( STRAFE_LEFT_KEY ) ? 1 : 0 ) - ( down.has( STRAFE_RIGHT_KEY ) ? 1 : 0 );
    input.jump = down.has( JUMP_KEY );
}

export function attachKeyboard(): () => void {
    const on = ( e: KeyboardEvent ) => {
        if ( e.ctrlKey && DRIVE_KEYS.has( e.code ) && ! typingTarget( e.target ) ) e.preventDefault();
        if ( e.code === JUMP_KEY && ! down.has( JUMP_KEY ) ) latchJump();
        down.add( e.code );
        recompute();
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
