// PlayerInput — the per-tick intent fed into simulate(). Plain data; S2 sends this over the wire.

export interface PlayerInput {
    seq: number;
    throttle: number; // 0..1
    brake: number; // 0..1
    strafe: number; // -1..1
    jump: boolean;
    usePowerUp: boolean; // reserved — fires a held pickup (S5 combat); no effect yet.
}

export function emptyInput( seq = 0 ): PlayerInput {
    return { seq, throttle: 0, brake: 0, strafe: 0, jump: false, usePowerUp: false };
}

// The client→server input message. A PLAIN object (Colyseus forbids Schema as a message payload):
// inputs are batched (one per fixed tick) so a single ~30Hz send carries every tick since the last —
// the server drains them in order, keeping 1-input-per-tick correctness regardless of send cadence.
export const INPUT_MESSAGE = 'input';

export interface InputMessage {
    inputs: PlayerInput[];
}
