import { emptyInput } from '@slur/shared';
import { typingTarget } from '../../dev/typing-target';
import { latchJump } from './jump-latch';

const THROTTLE_KEYS = [ 'KeyQ', 'KeyW' ];
const BRAKE_KEYS = [ 'KeyA', 'KeyS', 'ArrowDown' ];
const DRIVE_KEYS = new Set( [ ...THROTTLE_KEYS, ...BRAKE_KEYS, 'ArrowLeft', 'ArrowRight', 'Space' ] );

const input = emptyInput();
const down = new Set< string >();
const has = ( codes: readonly string[] ) => codes.some( ( c ) => down.has( c ) );

export const keyboardInput: Readonly< typeof input > = input;

function recompute(): void {
    input.throttle = has( THROTTLE_KEYS ) ? 1 : 0;
    input.brake = has( BRAKE_KEYS ) ? 1 : 0;
    input.strafe = ( down.has( 'ArrowLeft' ) ? 1 : 0 ) - ( down.has( 'ArrowRight' ) ? 1 : 0 );
    input.jump = down.has( 'Space' );
}

export function attachKeyboard(): () => void {
    const on = ( e: KeyboardEvent ) => {
        if ( e.ctrlKey && DRIVE_KEYS.has( e.code ) && ! typingTarget( e.target ) ) e.preventDefault();
        if ( e.code === 'Space' && ! down.has( 'Space' ) ) latchJump();
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
