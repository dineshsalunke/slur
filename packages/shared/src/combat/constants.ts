export const USE_POWERUP_MESSAGE = 'usePowerUp';

export const BOLT_SPEED = 900;
export const BOLT_TTL = 1.7;
export const BOLT_HALF = 1.5;

export const STUN_SECONDS = 1.2;
export const PICKUP_RESPAWN_S = 3;

export const HeldPower = { none: 0, bolt: 1 } as const;
export type HeldPower = ( typeof HeldPower )[ keyof typeof HeldPower ];
