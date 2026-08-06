// PlayerInput — the per-tick intent fed into stepShip. Plain data; S2 sends this over the wire.

export interface PlayerInput {
    seq: number;
    throttle: number; // 0..1
    brake: number; // 0..1
    strafe: number; // -1..1
    jump: boolean;
    boost: boolean;
    usePowerUp: boolean;
}

export function emptyInput( seq = 0 ): PlayerInput {
    return { seq, throttle: 0, brake: 0, strafe: 0, jump: false, boost: false, usePowerUp: false };
}
