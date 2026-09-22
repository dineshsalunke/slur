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
export const BLOCK_DEPTHS = [ 4, 8, 16 ];
export const BLOCK_DEPTH_WEIGHTS_START = [ 0.5, 0.35, 0.15 ];
export const BLOCK_DEPTH_WEIGHTS_MAX = [ 0.2, 0.35, 0.45 ];
export const CORRIDOR_BUFFER = 1;

export const FLICK_RATE_START = 0.15;
export const FLICK_RATE_MAX = 0.55;
export const FLICK_WIDTH = 1;

export interface Section {
    name: string;
    weight: number;
    i0: number;
    i1: number;
}
export const SECTIONS: Section[] = [
    { name: 'intro', weight: 5, i0: 0.08, i1: 0.28 },
    { name: 'build1', weight: 5, i0: 0.28, i1: 0.6 },
    { name: 'spike1', weight: 3, i0: 0.8, i1: 0.82 },
    { name: 'release1', weight: 3, i0: 0.55, i1: 0.14 },
    { name: 'rest1', weight: 4, i0: 0.06, i1: 0.06 },
    { name: 'build2', weight: 6, i0: 0.1, i1: 0.68 },
    { name: 'spike2', weight: 3, i0: 0.88, i1: 0.86 },
    { name: 'release2', weight: 3, i0: 0.58, i1: 0.16 },
    { name: 'rest2', weight: 4, i0: 0.05, i1: 0.05 },
    { name: 'build3', weight: 6, i0: 0.1, i1: 0.74 },
    { name: 'spike3', weight: 3, i0: 0.9, i1: 0.92 },
    { name: 'release3', weight: 3, i0: 0.6, i1: 0.18 },
    { name: 'bridge', weight: 6, i0: 0.1, i1: 0.03 },
    { name: 'finalbuild', weight: 5, i0: 0.06, i1: 0.8 },
    { name: 'finalcho', weight: 6, i0: 0.96, i1: 1 },
    { name: 'outro', weight: 5, i0: 0.6, i1: 0.02 },
];

export const REST_INTENSITY = 0.15;

export const GAP_P_START = 0.06;
export const GAP_P_MAX = 0.16;
export const FULL_GAP_FRAC = 0.4;

export const REACTION_WINDOW_S = 0.45;
export const DEMAND_SPACING_REST_S = 1.6;
export const DEMAND_SPACING_PEAK_S = 0.5;

export function demandSpacingSeconds( intensity: number ): number {
    const s = DEMAND_SPACING_REST_S + ( DEMAND_SPACING_PEAK_S - DEMAND_SPACING_REST_S ) * intensity;
    return s < REACTION_WINDOW_S ? REACTION_WINDOW_S : s;
}

export function demandSpacingSegments( intensity: number, segLen: number, speed: number ): number {
    const segs = Math.ceil( ( demandSpacingSeconds( intensity ) * speed ) / segLen );
    return segs < 1 ? 1 : segs;
}

export const GAP_BLOCK_RATE_START = 0.3;
export const GAP_BLOCK_RATE_MAX = 0.75;
export const GAP_BLOCK_ATTEMPTS = 6;

export const CRACK_FRAC = 0.45;
export const CRACK_W_LANES_MIN = 1;
export const CRACK_W_LANES_MAX = 5;
export const CRACK_SEGS_MIN = 2;
export const CRACK_SEGS_MAX = 4;
export const CRACK_EDGE_MARGIN_LANES = 2;
