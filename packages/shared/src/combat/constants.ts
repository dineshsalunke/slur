export const USE_POWERUP_MESSAGE = 'usePowerUp';
export const DROP_POWERUP_MESSAGE = 'dropPowerUp';

export interface PowerSlotMessage {
    slot: number;
    dir?: number;
    seq?: number;
}

export const HIT_MESSAGE = 'hit';

export interface HitMessage {
    x: number;
    y: number;
    z: number;
    victimId: string;
}

export const POWER_SLOTS = 3;

export const STUN_SECONDS = 1.2;
export const PICKUP_RESPAWN_S = 3;
export const PICKUP_GRAB_R = 3.2;

export const HeldPower = {
    none: 0,
    bolt: 1,
    seeker: 2,
    mine: 3,
    boost: 4,
    shield: 5,
    portal: 6,
    portalB: 7,
    tug: 8,
} as const;
export type HeldPower = ( typeof HeldPower )[ keyof typeof HeldPower ];
