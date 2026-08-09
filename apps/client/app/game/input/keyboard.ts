import { emptyInput } from '@slur/shared';

// One reused PlayerInput — recomputed on key events, never allocated per frame.
const input = emptyInput();
let seq = 0;
const down = new Set< string >();
const has = ( ...codes: string[] ) => codes.some( ( c ) => down.has( c ) );

function recompute(): void {
    input.throttle = has( 'KeyW', 'ArrowUp' ) ? 1 : 0;
    input.brake = has( 'KeyS', 'ArrowDown' ) ? 1 : 0;
    // strafe drives world +x, but the chase camera faces +z so world +x renders screen-LEFT.
    // Map Left→+1 / Right→-1 so on-screen left/right match the keys.
    input.strafe = ( has( 'KeyA', 'ArrowLeft' ) ? 1 : 0 ) - ( has( 'KeyD', 'ArrowRight' ) ? 1 : 0 );
    input.jump = has( 'Space' );
    // Fire (KeyE) is NOT an input axis — it's a discrete reliable room.send(USE_POWERUP_MESSAGE) in net-canvas
    // (an axis would machine-gun on hold). Shift is free too — boost became a pickup.
}

// Attach global key listeners; returns a cleanup fn for useEffect.
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
