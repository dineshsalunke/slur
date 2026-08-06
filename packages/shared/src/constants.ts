// Flight-feel tuning + fixed-step constants. Framework-free: no @colyseus/schema here.

export const TICK_RATE = 60;
export const FIXED_DT = 1 / TICK_RATE;

export interface FlightTuning {
    accel: number;
    brakeDecel: number;
    coastDrag: number;
    maxCruise: number;
    boostMul: number;
    boostAccel: number;
    energyMax: number;
    energyDrain: number;
    energyRegen: number;
    strafeAccel: number;
    strafeClamp: number;
    strafeDamp: number;
    halfWidth: number;
    riseGravity: number;
    fallGravity: number;
    jumpImpulse: number;
    doubleJumpImpulse: number;
    jumpCutFactor: number;
    maxJumps: number;
    coyoteTime: number;
    jumpBuffer: number;
}

// Starting values — tuned live in playtest. Do NOT tune here to "feel"; that is the human gate.
export const DEFAULT_TUNING: FlightTuning = {
    accel: 70,
    brakeDecel: 110,
    coastDrag: 18,
    maxCruise: 55,
    boostMul: 1.6,
    boostAccel: 50,
    energyMax: 100,
    energyDrain: 45,
    energyRegen: 22,
    strafeAccel: 70,
    strafeClamp: 26,
    strafeDamp: 1.8,
    halfWidth: 16,
    riseGravity: 52,
    fallGravity: 88,
    jumpImpulse: 21,
    doubleJumpImpulse: 17,
    jumpCutFactor: 0.42,
    maxJumps: 2,
    coyoteTime: 0.1,
    jumpBuffer: 0.1,
};
