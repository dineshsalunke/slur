export const TICK_RATE = 60;
export const FIXED_DT = 1 / TICK_RATE;

export const CELL = 4;

export interface FlightTuning {
    accel: number;
    brakeDecel: number;
    coastDrag: number;
    maxCruise: number;

    strafeAccel: number;
    strafeClamp: number;
    strafeDamp: number;
    halfWidth: number;

    halfW: number;
    halfL: number;

    riseGravity: number;
    fallGravity: number;
    jumpImpulse: number;
    doubleJumpImpulse: number;
    minJumpVel: number;

    maxJumps: number;
    coyoteTime: number;
    jumpBuffer: number;

    deathY: number;
    stepTol: number;
    respawnDelay: number;
    invulnTime: number;
    respawnSetback: number;
    respawnVz: number;
}

export interface JumpDesign {
    height: number;
    apexTime: number;
    descentTime: number;
    doubleHeight: number;
    minHeight: number;
}

export function deriveJump( d: JumpDesign ) {
    const riseGravity = ( 2 * d.height ) / ( d.apexTime * d.apexTime );
    return {
        riseGravity,
        fallGravity: ( 2 * d.height ) / ( d.descentTime * d.descentTime ),
        jumpImpulse: ( 2 * d.height ) / d.apexTime,
        doubleJumpImpulse: ( 2 * d.doubleHeight ) / d.apexTime,
        minJumpVel: Math.sqrt( 2 * riseGravity * d.minHeight ),
    };
}

export const DEFAULT_JUMP: JumpDesign = {
    height: 3.2,
    apexTime: 0.3,
    descentTime: 0.24,
    doubleHeight: 3.8,
    minHeight: 0.8,
};

export const DEFAULT_TUNING: FlightTuning = {
    accel: 40,
    brakeDecel: 110,
    coastDrag: 40,
    maxCruise: 55,
    strafeAccel: 165,
    strafeClamp: 80,
    strafeDamp: 14,
    halfWidth: 32,
    halfW: 1.3,
    halfL: 1.26,
    ...deriveJump( DEFAULT_JUMP ),
    maxJumps: 2,
    coyoteTime: 0.1,
    jumpBuffer: 0.1,
    deathY: -6,
    stepTol: 0.3,
    respawnDelay: 1,
    invulnTime: 1.5,
    respawnSetback: 12,
    respawnVz: 20,
};

export const JUMP_SAFETY = 0.8;

export function jumpAirtime( t: FlightTuning ): number {
    const tUp = t.jumpImpulse / t.riseGravity;
    const tDown = t.jumpImpulse / Math.sqrt( t.riseGravity * t.fallGravity );
    return tUp + tDown;
}
export function jumpReach( t: FlightTuning ): number {
    return t.maxCruise * jumpAirtime( t ) * JUMP_SAFETY;
}

export const COUNTDOWN_SECONDS = 3;
export const RACE_GRACE_SECONDS = 20;
export const MAX_RACE_SECONDS = 180;
export const COLOR_COUNT = 12;
export const START_STAGGER = CELL;

export const WEAVE_SLOPE_SAFETY = 0.8;
export const WEAVE_CURV_SAFETY = 0.8;
export const NODE_PERIOD_SAFETY = 1.1;

export const WEAVE_SLOPE_OCTAVE_FACTOR = 2;
export const WEAVE_CURV_OCTAVE_FACTOR = 12;

export function deriveWeaveSlopeCap( tunings: FlightTuning[] ): number {
    let m = Number.POSITIVE_INFINITY;
    for ( const t of tunings ) m = Math.min( m, t.strafeClamp / t.maxCruise );
    return m * WEAVE_SLOPE_SAFETY;
}
export function deriveWeaveCurvatureCap( tunings: FlightTuning[], cell: number ): number {
    let m = Number.POSITIVE_INFINITY;
    for ( const t of tunings ) m = Math.min( m, ( t.strafeAccel * cell ) / ( t.maxCruise * t.maxCruise ) );
    return m * WEAVE_CURV_SAFETY;
}
export function deriveNodePeriod( slopeCap: number, curvCap: number, amp: number ): number {
    const slopeReq = ( amp * WEAVE_SLOPE_OCTAVE_FACTOR ) / slopeCap;
    const curvReq = Math.sqrt( ( amp * WEAVE_CURV_OCTAVE_FACTOR ) / curvCap );
    return Math.ceil( Math.max( slopeReq, curvReq ) * NODE_PERIOD_SAFETY );
}

export const WEAVE_CARRIER_BUDGET = 0.88;
export const WEAVE_NOISE_FRAC = 0.08;

export function deriveWeavePeriod( slopeCap: number, curvCap: number, amp: number, budget: number ): number {
    const pSlope = ( 3 * amp ) / ( slopeCap * budget );
    const pCurv = Math.sqrt( ( 24 * amp ) / ( curvCap * budget ) );
    return Math.ceil( Math.max( pSlope, pCurv ) );
}

export const CORRIDOR_W_START = 5;
export const CORRIDOR_W_MIN = 4;

export const WALL_DENSITY_START = 0.14;
export const WALL_DENSITY_MAX = 0.4;
export const WALL_NOISE_FZ_LANE = 1.0;
export const WALL_NOISE_FZ_SEG = 1.5;
export const BLOCK_MAX_LANES = 3;
export const CORRIDOR_BUFFER = 1;

export const FLICK_RATE_START = 0.15;
export const FLICK_RATE_MAX = 0.55;
export const FLICK_WIDTH = 1;

export const SLOW_GRACE_START = 0.05;
export const SLOW_GRACE_MAX = 0.13;
export const SLOW_NOISE_FZ_LANE = 3.2;
export const SLOW_NOISE_FZ_SEG = 3.0;

export interface Section {
    name: string;
    weight: number;
    i0: number;
    i1: number;
}
export const SECTIONS: Section[] = [
    { name: 'intro', weight: 5, i0: 0.5, i1: 0.55 },
    { name: 'verse1', weight: 7, i0: 0.26, i1: 0.32 },
    { name: 'verse2', weight: 7, i0: 0.3, i1: 0.36 },
    { name: 'prechor1', weight: 5, i0: 0.4, i1: 0.66 },
    { name: 'chorus1', weight: 7, i0: 0.8, i1: 0.82 },
    { name: 'chorus2', weight: 6, i0: 0.82, i1: 0.8 },
    { name: 'verse3', weight: 6, i0: 0.38, i1: 0.44 },
    { name: 'verse4', weight: 5, i0: 0.42, i1: 0.48 },
    { name: 'prechor2', weight: 5, i0: 0.52, i1: 0.74 },
    { name: 'chorus3', weight: 6, i0: 0.88, i1: 0.9 },
    { name: 'chorus4', weight: 6, i0: 0.9, i1: 0.88 },
    { name: 'bridge', weight: 8, i0: 0.18, i1: 0.28 },
    { name: 'finalcho', weight: 10, i0: 0.96, i1: 1.0 },
    { name: 'outro', weight: 7, i0: 0.6, i1: 0.06 },
];

export const GAP_P_START = 0.06;
export const GAP_P_MAX = 0.16;
export const FULL_GAP_FRAC = 0.4;

export const DRAG_SPEED_FRAC = 0.5;
