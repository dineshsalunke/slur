import { emptyInput } from '@slur/shared';
import { latchJump } from './jump-latch';

const input = emptyInput();
const down = new Set< string >();
const has = ( ...codes: string[] ) => codes.some( ( c ) => down.has( c ) );

export const keyboardInput: Readonly< typeof input > = input;

function recompute(): void {
    input.throttle = has( 'KeyW', 'ArrowUp' ) ? 1 : 0;
    input.brake = has( 'KeyS', 'ArrowDown' ) ? 1 : 0;
    input.strafe = ( has( 'KeyA', 'ArrowLeft' ) ? 1 : 0 ) - ( has( 'KeyD', 'ArrowRight' ) ? 1 : 0 );
    input.jump = has( 'Space' );
}

export function attachKeyboard(): () => void {
    const on = ( e: KeyboardEvent ) => {
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
    return () => {
        removeEventListener( 'keydown', on );
        removeEventListener( 'keyup', off );
        removeEventListener( 'blur', releaseAll );
        document.removeEventListener( 'visibilitychange', onVisibility );
    };
}
