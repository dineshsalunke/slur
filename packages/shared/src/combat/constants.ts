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

export const MINE_BURST_MESSAGE = 'mineBurst';

export const MINE_RATIO = 0.15;
export const MINE_LEAD_S = 0.8;
export const MINE_BACK_GAP = 1;
export const MINE_ARM_S = 0.5;
export const MINE_TRIGGER_R = 3;
export const MINE_TRIGGER_H = 2;
export const MINE_STUN_S = 1.5;
export const MINE_SPEED_CUT = 0.6;
export const MINE_TTL = 20;
export const MINE_MAX_PER_OWNER = 3;
export const MINE_HALF = 1.1;
export const MINE_HEIGHT = 0.9;

export const BOOST_RATIO = 0.15;
export const BOOST_GAIN = 0.75;
export const BOOST_S = 2;
export const BOOST_EASE_S = 0.2;
export const BOOST_RISE_S = 0.25;
export const BOOST_GLIDE_S = 0.3;

export const SHIELD_POP_MESSAGE = 'shieldPop';

export const SHIELD_RATIO = 0.15;
export const SHIELD_S = 5;

export const PORTAL_HOP_MESSAGE = 'portalHop';
export const PORTAL_FIZZLE_MESSAGE = 'portalFizzle';

export interface PortalHopMessage {
    fromX: number;
    fromY: number;
    fromZ: number;
    x: number;
    y: number;
    z: number;
    victimId: string;
}

export interface PortalFizzleMessage {
    x: number;
    y: number;
    z: number;
    ownerId: string;
}

export const PORTAL_RATIO = 0.1;
