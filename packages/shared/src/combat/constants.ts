export const USE_POWERUP_MESSAGE = 'usePowerUp';
export const DROP_POWERUP_MESSAGE = 'dropPowerUp';

export interface PowerSlotMessage {
    slot: number;
}

export const POWER_SLOTS = 3;

export const BOLT_SPEED = 900;
export const BOLT_TTL = 1.7;
export const BOLT_HALF = 1.5;
export const BOLT_SPAWN_AHEAD = 3;

export const STUN_SECONDS = 1.2;
export const PICKUP_RESPAWN_S = 3;

export const HeldPower = { none: 0, bolt: 1, seeker: 2 } as const;
export type HeldPower = ( typeof HeldPower )[ keyof typeof HeldPower ];

export type SeekerWindowMode = 'time' | 'distance';

export const SEEKER_HIT_MESSAGE = 'seekerHit';
export const SEEKER_MISS_MESSAGE = 'seekerMiss';

export const SEEKER_RATIO = 0.25;
export const SEEKER_LOCK_RANGE = 600;
export const SEEKER_SPEED_FACTOR = 1.15;
export const SEEKER_RAMP_S = 0.3;
export const SEEKER_TRACK_TURN = 240;
export const SEEKER_TURN = 40;
export const SEEKER_WINDOW_MODE: SeekerWindowMode = 'time';
export const SEEKER_WINDOW_S = 0.35;
export const SEEKER_WINDOW_U = 30;
export const SEEKER_FLY_Y = 2.5;
export const SEEKER_STRIKE_Y = 0.5;
export const SEEKER_DROP_RATE = 12;
export const SEEKER_TRAIL_STEP = 1;
export const SEEKER_TRAIL_LEN = 1024;
export const SEEKER_HIT_BAND = 1.2;
export const SEEKER_HALF = 1;
export const SEEKER_TTL = 20;
export const SEEKER_STUN_S = 2;
export const SEEKER_SPAWN_AHEAD = 3;
