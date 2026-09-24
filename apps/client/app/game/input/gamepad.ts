import { addEffect } from '@react-three/fiber';
import { emptyInput, type PlayerInput } from '@slur/shared';
import { latchJump } from './jump-latch';
import { synthKey } from './synth-key';

export const STICK_DEADZONE = 0.2;

const A = 0;
const LT = 6;
const RT = 7;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;

export const JUMP_EDGE = 'jump';

export const PAD_KEYS: readonly ( readonly [ number, string ] )[] = [
    [ A, JUMP_EDGE ],
    [ 2, 'KeyE' ],
    [ 5, 'KeyE' ],
    [ 3, 'KeyQ' ],
    [ 4, 'KeyQ' ],
    [ 8, 'KeyM' ],
    [ 9, 'Enter' ],
];

export type PadLike = Pick< Gamepad, 'axes' | 'buttons' >;

const pressed = ( pad: PadLike, i: number ) => pad.buttons[ i ]?.pressed ?? false;
const value = ( pad: PadLike, i: number ) => pad.buttons[ i ]?.value ?? 0;

function stick( x: number ): number {
    const mag = Math.abs( x );
    if ( mag < STICK_DEADZONE ) return 0;
    return Math.sign( x ) * Math.min( 1, ( mag - STICK_DEADZONE ) / ( 1 - STICK_DEADZONE ) );
}

export function readPad( pad: PadLike, out: PlayerInput ): void {
    const dpad = ( pressed( pad, DPAD_LEFT ) ? 1 : 0 ) - ( pressed( pad, DPAD_RIGHT ) ? 1 : 0 );
    const strafe = dpad !== 0 ? dpad : -stick( pad.axes[ 0 ] ?? 0 );
    out.throttle = Math.max( out.throttle, value( pad, RT ) );
    out.brake = Math.max( out.brake, value( pad, LT ) );
    out.strafe = Math.max( -1, Math.min( 1, out.strafe + strafe ) );
    out.jump = out.jump || pressed( pad, A );
}

export function padEdges( pad: PadLike, was: boolean[], emit: ( code: string ) => void ): void {
    for ( const [ button, code ] of PAD_KEYS ) {
        if ( pressed( pad, button ) && ! was[ button ] ) emit( code );
    }
    for ( let i = 0; i < pad.buttons.length; i++ ) was[ i ] = pressed( pad, i );
}

const input = emptyInput();
const history = new Map< number, boolean[] >();
let stop: ( () => void ) | null = null;

export const gamepadInput: Readonly< PlayerInput > = input;

function clear(): void {
    input.throttle = 0;
    input.brake = 0;
    input.strafe = 0;
    input.jump = false;
}

function emit( code: string ): void {
    if ( code === JUMP_EDGE ) latchJump();
    else synthKey( code );
}

function poll(): void {
    clear();
    for ( const pad of navigator.getGamepads() ) {
        if ( ! pad?.connected ) continue;
        readPad( pad, input );
        let was = history.get( pad.index );
        if ( ! was ) {
            was = [];
            history.set( pad.index, was );
        }
        padEdges( pad, was, emit );
    }
}

function connected(): void {
    stop ??= addEffect( poll );
}

function disconnected( e: GamepadEvent ): void {
    history.delete( e.gamepad.index );
    if ( navigator.getGamepads().some( ( p ) => p?.connected ) ) return;
    stop?.();
    stop = null;
    clear();
}

if ( typeof window !== 'undefined' ) {
    addEventListener( 'gamepadconnected', connected );
    addEventListener( 'gamepaddisconnected', disconnected );
}
