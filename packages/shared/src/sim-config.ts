import {
    BOLT_HALF,
    BOLT_SPEED,
    BOLT_TTL,
    PICKUP_RESPAWN_S,
    SEEKER_CLIMB,
    SEEKER_CRUISE_Y,
    SEEKER_DIVE_DZ,
    SEEKER_HALF,
    SEEKER_HIT_BAND,
    SEEKER_LOCK_RANGE,
    SEEKER_RAMP_S,
    SEEKER_RATIO,
    SEEKER_SCOPE,
    SEEKER_SPEED,
    SEEKER_STRIKE_Y,
    SEEKER_STUN_S,
    SEEKER_TRACK_TURN,
    SEEKER_TTL,
    SEEKER_TURN,
    SEEKER_WINDOW_MODE,
    SEEKER_WINDOW_S,
    SEEKER_WINDOW_U,
    type SeekerScope,
    type SeekerWindowMode,
    STUN_SECONDS,
} from './combat/constants.js';

export interface SimConfig {
    boltSpeed: number;
    boltTtl: number;
    boltHalf: number;
    stunSeconds: number;
    pickupRespawnS: number;
    seekerRatio: number;
    seekerScope: SeekerScope;
    seekerLockRange: number;
    seekerSpeed: number;
    seekerRampS: number;
    seekerTrackTurn: number;
    seekerTurn: number;
    seekerWindowMode: SeekerWindowMode;
    seekerWindowS: number;
    seekerWindowU: number;
    seekerCruiseY: number;
    seekerStrikeY: number;
    seekerClimb: number;
    seekerDiveDz: number;
    seekerHitBand: number;
    seekerHalf: number;
    seekerTtl: number;
    seekerStunS: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
    boltSpeed: BOLT_SPEED,
    boltTtl: BOLT_TTL,
    boltHalf: BOLT_HALF,
    stunSeconds: STUN_SECONDS,
    pickupRespawnS: PICKUP_RESPAWN_S,
    seekerRatio: SEEKER_RATIO,
    seekerScope: SEEKER_SCOPE,
    seekerLockRange: SEEKER_LOCK_RANGE,
    seekerSpeed: SEEKER_SPEED,
    seekerRampS: SEEKER_RAMP_S,
    seekerTrackTurn: SEEKER_TRACK_TURN,
    seekerTurn: SEEKER_TURN,
    seekerWindowMode: SEEKER_WINDOW_MODE,
    seekerWindowS: SEEKER_WINDOW_S,
    seekerWindowU: SEEKER_WINDOW_U,
    seekerCruiseY: SEEKER_CRUISE_Y,
    seekerStrikeY: SEEKER_STRIKE_Y,
    seekerClimb: SEEKER_CLIMB,
    seekerDiveDz: SEEKER_DIVE_DZ,
    seekerHitBand: SEEKER_HIT_BAND,
    seekerHalf: SEEKER_HALF,
    seekerTtl: SEEKER_TTL,
    seekerStunS: SEEKER_STUN_S,
};
