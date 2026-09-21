import { emptyInput } from '@slur/shared';

const input = emptyInput();
let seq = 0;
const down = new Set< string >();
const has = ( ...codes: string[] ) => codes.some( ( c ) => down.has( c ) );

function recompute(): void {
    input.throttle = has( 'KeyW', 'ArrowUp' ) ? 1 : 0;
    input.brake = has( 'KeyS', 'ArrowDown' ) ? 1 : 0;
    input.strafe = ( has( 'KeyA', 'ArrowLeft' ) ? 1 : 0 ) - ( has( 'KeyD', 'ArrowRight' ) ? 1 : 0 );
    input.jump = has( 'Space' );
}

export function attachKeyboard(): () => void {
    const on = ( e: KeyboardEvent ) => {
        down.add( e.code );
        recompute();
    };
    const off = ( e: KeyboardEvent ) => {
        down.delete( e.code );
        recompute();
    };
    addEventListener( 'keydown', on );
    addEventListener( 'keyup', off );
    return () => {
        removeEventListener( 'keydown', on );
        removeEventListener( 'keyup', off );
    };
}

export function currentInput() {
    input.seq = ++seq;
    return input;
}
