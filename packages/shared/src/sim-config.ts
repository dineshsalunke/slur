import {
    BOLT_HALF,
    BOLT_SPEED,
    BOLT_TTL,
    BOOST_EASE_S,
    BOOST_GAIN,
    BOOST_RATIO,
    BOOST_RISE_S,
    BOOST_S,
    MINE_ARM_S,
    MINE_BACK_GAP,
    MINE_HALF,
    MINE_HEIGHT,
    MINE_LEAD_S,
    MINE_MAX_PER_OWNER,
    MINE_RATIO,
    MINE_SPEED_CUT,
    MINE_STUN_S,
    MINE_TRIGGER_H,
    MINE_TRIGGER_R,
    MINE_TTL,
    PICKUP_RESPAWN_S,
    SEEKER_DROP_RATE,
    SEEKER_FLY_Y,
    SEEKER_HALF,
    SEEKER_HIT_BAND,
    SEEKER_LOCK_RANGE,
    SEEKER_RAMP_S,
    SEEKER_RATIO,
    SEEKER_SPEED_FACTOR,
    SEEKER_STRIKE_Y,
    SEEKER_STUN_S,
    SEEKER_TRACK_TURN,
    SEEKER_TRAIL_LEN,
    SEEKER_TRAIL_STEP,
    SEEKER_TTL,
    SEEKER_TURN,
    SEEKER_WINDOW_MODE,
    SEEKER_WINDOW_S,
    SEEKER_WINDOW_U,
    type SeekerWindowMode,
    SHIELD_RATIO,
    STUN_SECONDS,
} from './combat/constants.js';

export interface SimConfig {
    boltSpeed: number;
    boltTtl: number;
    boltHalf: number;
    stunSeconds: number;
    pickupRespawnS: number;
    seekerRatio: number;
    seekerLockRange: number;
    seekerSpeedFactor: number;
    seekerRampS: number;
    seekerTrackTurn: number;
    seekerTurn: number;
    seekerWindowMode: SeekerWindowMode;
    seekerWindowS: number;
    seekerWindowU: number;
    seekerFlyY: number;
    seekerStrikeY: number;
    seekerDropRate: number;
    seekerTrailStep: number;
    seekerTrailLen: number;
    seekerHitBand: number;
    seekerHalf: number;
    seekerTtl: number;
    seekerStunS: number;
    mineRatio: number;
    mineLeadS: number;
    mineBackGap: number;
    mineArmS: number;
    mineTriggerR: number;
    mineTriggerH: number;
    mineStunS: number;
    mineSpeedCut: number;
    mineTtl: number;
    mineMaxPerOwner: number;
    mineHalf: number;
    mineHeight: number;
    boostRatio: number;
    boostGain: number;
    boostS: number;
    boostEaseS: number;
    boostRiseS: number;
    shieldRatio: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
    boltSpeed: BOLT_SPEED,
    boltTtl: BOLT_TTL,
    boltHalf: BOLT_HALF,
    stunSeconds: STUN_SECONDS,
    pickupRespawnS: PICKUP_RESPAWN_S,
    seekerRatio: SEEKER_RATIO,
    seekerLockRange: SEEKER_LOCK_RANGE,
    seekerSpeedFactor: SEEKER_SPEED_FACTOR,
    seekerRampS: SEEKER_RAMP_S,
    seekerTrackTurn: SEEKER_TRACK_TURN,
    seekerTurn: SEEKER_TURN,
    seekerWindowMode: SEEKER_WINDOW_MODE,
    seekerWindowS: SEEKER_WINDOW_S,
    seekerWindowU: SEEKER_WINDOW_U,
    seekerFlyY: SEEKER_FLY_Y,
    seekerStrikeY: SEEKER_STRIKE_Y,
    seekerDropRate: SEEKER_DROP_RATE,
    seekerTrailStep: SEEKER_TRAIL_STEP,
    seekerTrailLen: SEEKER_TRAIL_LEN,
    seekerHitBand: SEEKER_HIT_BAND,
    seekerHalf: SEEKER_HALF,
    seekerTtl: SEEKER_TTL,
    seekerStunS: SEEKER_STUN_S,
    mineRatio: MINE_RATIO,
    mineLeadS: MINE_LEAD_S,
    mineBackGap: MINE_BACK_GAP,
    mineArmS: MINE_ARM_S,
    mineTriggerR: MINE_TRIGGER_R,
    mineTriggerH: MINE_TRIGGER_H,
    mineStunS: MINE_STUN_S,
    mineSpeedCut: MINE_SPEED_CUT,
    mineTtl: MINE_TTL,
    mineMaxPerOwner: MINE_MAX_PER_OWNER,
    mineHalf: MINE_HALF,
    mineHeight: MINE_HEIGHT,
    boostRatio: BOOST_RATIO,
    boostGain: BOOST_GAIN,
    boostS: BOOST_S,
    boostEaseS: BOOST_EASE_S,
    boostRiseS: BOOST_RISE_S,
    shieldRatio: SHIELD_RATIO,
};
