export interface PlayerInput {
    seq: number;
    throttle: number;
    brake: number;
    strafe: number;
    jump: boolean;
}

export function emptyInput( seq = 0 ): PlayerInput {
    return { seq, throttle: 0, brake: 0, strafe: 0, jump: false };
}

export const INPUT_MESSAGE = 'input';

export interface InputMessage {
    inputs: PlayerInput[];
}
