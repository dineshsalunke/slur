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
    strafeKick: number;

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

    bounceBack: number;
    bounceStun: number;
    grazeDepth: number;
    smashKeep: number;

    deathY: number;
    stepTol: number;
    respawnDelay: number;
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
    strafeKick: 0,
    halfW: 1.3,
    halfL: 1.26,
    ...deriveJump( DEFAULT_JUMP ),
    maxJumps: 2,
    coyoteTime: 0.1,
    jumpBuffer: 0.1,
    bounceBack: 9,
    bounceStun: 0.25,
    grazeDepth: 0.5,
    smashKeep: 0.45,
    deathY: -6,
    stepTol: 0.3,
    respawnDelay: 1,
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
export const START_STAGGER_U = 4;

export const WEAVE_SLOPE_SAFETY = 0.8;
export const WEAVE_CURV_SAFETY = 0.8;
export const NODE_PERIOD_SAFETY = 1.1;

export const WEAVE_SLOPE_OCTAVE_FACTOR = 2;
export const WEAVE_CURV_OCTAVE_FACTOR = 12;

export const MAX_SHIP_WIDTH = CELL;

export interface TrackContract {
    pacingCruise: number;
    weaveCruise: number;
    weaveStrafeClamp: number;
    weaveStrafeAccel: number;
    registerCruise: number;
    smashKeep: number;
    shipHalfW: number;
    shipHalfL: number;
}

export const TRACK_CONTRACT: TrackContract = {
    pacingCruise: 55,
    weaveCruise: 62,
    weaveStrafeClamp: 65,
    weaveStrafeAccel: 118,
    registerCruise: 124,
    smashKeep: 0.45,
    shipHalfW: 1.3,
    shipHalfL: 3,
};

const ROSTER_BOUNDS = [
    [ 'smashKeep', 'smashKeep' ],
    [ 'halfW', 'shipHalfW' ],
    [ 'halfL', 'shipHalfL' ],
] as const;

export const SCORE_ADHERENCE_FLOOR = 0.75;
export const SCORE_ACCENT_ADHERENCE = 1;
export const CALM_TUBE_HALF = 5;

export const WEAVE_SLOPE_CAP = ( TRACK_CONTRACT.weaveStrafeClamp / TRACK_CONTRACT.weaveCruise ) * WEAVE_SLOPE_SAFETY;

export const WEAVE_CURVATURE_CAP =
    ( ( TRACK_CONTRACT.weaveStrafeAccel * CELL ) / ( TRACK_CONTRACT.weaveCruise * TRACK_CONTRACT.weaveCruise ) ) *
    WEAVE_CURV_SAFETY;

export function weaveThreadSpeed( t: FlightTuning ): number {
    return Math.min( t.strafeClamp / WEAVE_SLOPE_CAP, Math.sqrt( ( t.strafeAccel * CELL ) / WEAVE_CURVATURE_CAP ) );
}

export const WEAVE_MIN_THREAD_FRACTION = 0.5;

export function rosterContractFailures( classes: { id: string; tuning: FlightTuning }[] ): string[] {
    const threadFloor = TRACK_CONTRACT.pacingCruise * WEAVE_MIN_THREAD_FRACTION;
    const out: string[] = [];
    for ( const c of classes ) {
        const width = 2 * c.tuning.halfW;
        if ( width > MAX_SHIP_WIDTH )
            out.push( `${ c.id }: full width ${ width }u exceeds MAX_SHIP_WIDTH ${ MAX_SHIP_WIDTH }u` );
        const thread = weaveThreadSpeed( c.tuning );
        if ( thread < threadFloor )
            out.push(
                `${ c.id }: follows the racing line at only ${ thread.toFixed( 1 ) }u/s, under the ${ threadFloor }u/s floor`,
            );
        if ( c.tuning.maxCruise > TRACK_CONTRACT.registerCruise )
            out.push(
                `${ c.id }: maxCruise ${ c.tuning.maxCruise }u/s exceeds the ${ TRACK_CONTRACT.registerCruise }u/s register cruise`,
            );
        for ( const [ field, bound ] of ROSTER_BOUNDS )
            if ( c.tuning[ field ] > TRACK_CONTRACT[ bound ] )
                out.push(
                    `${ c.id }: ${ field } ${ c.tuning[ field ] } exceeds the track contract ${ TRACK_CONTRACT[ bound ] }`,
                );
    }
    return out;
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

export const WALL_DENSITY_START = 0.28;
export const WALL_DENSITY_MAX = 0.9;
export const WALL_NOISE_FZ_LANE = 4.0;
export const WALL_NOISE_FZ_SEG = 1.5;
export const WALL_RUN_LANES_MIN = 2;
export const BLOCK_MAX_LANES = 3;
export const BLOCK_DEPTH_MIN = 3;
export const BLOCK_DEPTH_MAX = 18;
export const BLOCK_DEPTH_CURVE_K_REST = 3.5948;
export const BLOCK_DEPTH_CURVE_K_PEAK = 0.5157;
export const BLOCK_WIDTH_MIN = 4;
export const BLOCK_WIDTH_MAX = 20;
export const BLOCK_WIDTH_CURVE_K_REST = 1.1435;
export const BLOCK_WIDTH_CURVE_K_PEAK = 0.5157;
export const BLOCK_SPLIT_GAP_MIN = 2;
export const BLOCK_SPLIT_GAP_MAX = 9;

export const FRACTURE_RATE_START = 0.15;
export const FRACTURE_RATE_MAX = 0.35;
export const FRACTURE_MAX_WIDTH = 12;
export const FRACTURE_MAX_DEPTH = 12;

export const OPEN_BAND_START = 8;
export const OPEN_BAND_PEAK = 6;

export const PINCH_LANES = 3;
export const PINCH_INTENSITY_MIN = 0.45;
export const PINCH_RATE_MAX = 0.3;
export const PINCH_SEGS_MIN = 2;
export const PINCH_SEGS_MAX = 4;
export const PINCH_LEAD_S = 1.2;
export const PINCH_FUNNEL_SEGS = 3;

export function pinchLeadSegments( segLen: number, speed: number ): number {
    return Math.ceil( ( PINCH_LEAD_S * speed ) / segLen );
}

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
    { name: 'intro', weight: 6, i0: 0.1, i1: 0.34 },
    { name: 'build1', weight: 7, i0: 0.34, i1: 0.74 },
    { name: 'spike1', weight: 4, i0: 0.84, i1: 0.86 },
    { name: 'rest1', weight: 4, i0: 0.05, i1: 0.05 },
    { name: 'build2', weight: 10, i0: 0.16, i1: 0.8 },
    { name: 'spike2', weight: 4, i0: 0.9, i1: 0.88 },
    { name: 'bridge', weight: 4, i0: 0.06, i1: 0.03 },
    { name: 'finalbuild', weight: 6, i0: 0.14, i1: 0.8 },
    { name: 'finalcho', weight: 7, i0: 0.96, i1: 1 },
    { name: 'outro', weight: 5, i0: 0.6, i1: 0.02 },
];

export const REST_INTENSITY = 0.08;

export const GAP_REST_FLOOR = 0.55;
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
