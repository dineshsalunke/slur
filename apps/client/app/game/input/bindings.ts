import type { Action } from './actions';

export type DpadArm = 'up' | 'down' | 'left' | 'right';

export interface Bindings {
    readonly keyboard: Readonly< Partial< Record< string, Action > > >;
    readonly pad: readonly ( readonly [ number, Action ] )[];
    readonly touch: Readonly< Record< DpadArm, Action > >;
}

export const BINDINGS: Bindings = {
    keyboard: {
        KeyE: 'fireForward',
        KeyD: 'fireBack',
        KeyS: 'previous',
        KeyF: 'next',
        KeyX: 'drop',
        KeyM: 'mute',
    },
    pad: [
        [ 1, 'fireBack' ],
        [ 2, 'fireForward' ],
        [ 5, 'fireForward' ],
        [ 3, 'next' ],
        [ 4, 'next' ],
        [ 8, 'mute' ],
        [ 9, 'start' ],
    ],
    touch: {
        up: 'fireForward',
        down: 'fireBack',
        left: 'previous',
        right: 'next',
    },
};

export function keyOf( action: Action ): string {
    for ( const [ code, bound ] of Object.entries( BINDINGS.keyboard ) ) if ( bound === action ) return code;
    return '';
}
