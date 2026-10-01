import {
    BOOST_EASE_S,
    BOOST_GAIN,
    BOOST_GLIDE_S,
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
    PICKUP_GRAB_R,
    PICKUP_RESPAWN_S,
    SHIELD_RATIO,
    SHIELD_S,
    STUN_SECONDS,
} from './combat/constants.js';
import { DEFAULT_PORTAL_CONFIG, type PortalConfig } from './combat/portal.js';
import { BOLT_HALF, BOLT_SPEED, BOLT_TTL } from './features/bolt/bolt-constants.js';
import {
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
} from './features/seeker/seeker-constants.js';
import {
    SLOW_CAP,
    TOW_JUMP,
    TOW_KICK,
    TOW_S,
    TOW_STRAFE_SCALE,
    TUG_BLOCK_MAX,
    TUG_BLOCK_MIN,
    TUG_EASE_S,
    TUG_GAIN,
    TUG_KICK,
    TUG_LATCH_SLACK,
    TUG_RANGE,
    TUG_RATIO,
    TUG_RELEASE_S,
    TUG_RISE_S,
    TUG_S,
    TUG_SLOW_S,
    TUG_SPEED_CUT,
    TUG_THROW_MAX_S,
    TUG_THROW_MIN_S,
} from './features/tug/tug-constants.js';

export interface SimConfig extends PortalConfig {
    boltSpeed: number;
    boltTtl: number;
    boltHalf: number;
    stunSeconds: number;
    pickupRespawnS: number;
    pickupGrabR: number;
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
    boostGlideS: number;
    shieldRatio: number;
    shieldS: number;
    tugRatio: number;
    tugRange: number;
    tugBlockMin: number;
    tugBlockMax: number;
    tugThrowMinS: number;
    tugThrowMaxS: number;
    tugLatchSlack: number;
    tugKick: number;
    tugS: number;
    tugGain: number;
    tugEaseS: number;
    tugRiseS: number;
    tugReleaseS: number;
    tugSlowS: number;
    tugSpeedCut: number;
    slowCap: number;
    towKick: number;
    towS: number;
    towStrafeScale: number;
    towJump: boolean;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
    boltSpeed: BOLT_SPEED,
    boltTtl: BOLT_TTL,
    boltHalf: BOLT_HALF,
    stunSeconds: STUN_SECONDS,
    pickupRespawnS: PICKUP_RESPAWN_S,
    pickupGrabR: PICKUP_GRAB_R,
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
    boostGlideS: BOOST_GLIDE_S,
    shieldRatio: SHIELD_RATIO,
    shieldS: SHIELD_S,
    tugRatio: TUG_RATIO,
    tugRange: TUG_RANGE,
    tugBlockMin: TUG_BLOCK_MIN,
    tugBlockMax: TUG_BLOCK_MAX,
    tugThrowMinS: TUG_THROW_MIN_S,
    tugThrowMaxS: TUG_THROW_MAX_S,
    tugLatchSlack: TUG_LATCH_SLACK,
    tugKick: TUG_KICK,
    tugS: TUG_S,
    tugGain: TUG_GAIN,
    tugEaseS: TUG_EASE_S,
    tugRiseS: TUG_RISE_S,
    tugReleaseS: TUG_RELEASE_S,
    tugSlowS: TUG_SLOW_S,
    tugSpeedCut: TUG_SPEED_CUT,
    slowCap: SLOW_CAP,
    towKick: TOW_KICK,
    towS: TOW_S,
    towStrafeScale: TOW_STRAFE_SCALE,
    towJump: TOW_JUMP,
    ...DEFAULT_PORTAL_CONFIG,
};
