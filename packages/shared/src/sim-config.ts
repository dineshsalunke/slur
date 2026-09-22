import { BOLT_HALF, BOLT_SPEED, BOLT_TTL, PICKUP_RESPAWN_S, STUN_SECONDS } from './combat/constants.js';

export interface SimConfig {
    boltSpeed: number;
    boltTtl: number;
    boltHalf: number;
    stunSeconds: number;
    pickupRespawnS: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
    boltSpeed: BOLT_SPEED,
    boltTtl: BOLT_TTL,
    boltHalf: BOLT_HALF,
    stunSeconds: STUN_SECONDS,
    pickupRespawnS: PICKUP_RESPAWN_S,
};
