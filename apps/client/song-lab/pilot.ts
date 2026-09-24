import {
    FIXED_DT,
    type FlightTuning,
    isHole,
    type JumpMode,
    type JumpPilot,
    newJumpPilot,
    type OpenSpan,
    type PlayerInput,
    SEG_LEN,
    type SimShip,
    type SimWorld,
    simulate,
    steerJump,
    type Track,
} from '@slur/shared';

export const PILOT_LOOK_S = 0;
export const PILOT_BRAKE_SHARE = 0.6;
export const PILOT_PLAN_S = 1.2;
export const PILOT_MAX_LEAD = 60;
export const PILOT_LEAD_STEP = 1;
export const PILOT_PREDICT_TICKS = 360;

export interface Hole {
    z0: number;
    z1: number;
}

interface JumpPlan {
    hole: number;
    takeoffZ: number;
    mode: JumpMode;
    jp: JumpPilot;
}

export interface PilotCourse {
    spans: readonly OpenSpan[];
    holes: readonly Hole[];
}

export interface Pilot {
    course: PilotCourse;
    tuning: FlightTuning;
    track: Track;
    plan: JumpPlan | null;
    predicting: boolean;
    wasDead: boolean;
}

export function trackHoles( track: Track, length: number ): Hole[] {
    const out: Hole[] = [];
    for ( let i = 0; i < length; i++ ) {
        if ( ! isHole( track.segmentAt( i ) ) ) continue;
        const z0 = i * SEG_LEN;
        const last = out[ out.length - 1 ];
        if ( last !== undefined && last.z1 === z0 ) last.z1 = z0 + SEG_LEN;
        else out.push( { z0, z1: z0 + SEG_LEN } );
    }
    return out;
}

export function newPilot( course: PilotCourse, tuning: FlightTuning, track: Track ): Pilot {
    return { course, tuning, track, plan: null, predicting: false, wasDead: false };
}

function spanAt( spans: readonly OpenSpan[], z: number ): OpenSpan | undefined {
    let lo = 0;
    let hi = spans.length - 1;
    while ( lo <= hi ) {
        const mid = ( lo + hi ) >> 1;
        const s = spans[ mid ];
        if ( z < s.z0 ) hi = mid - 1;
        else if ( z >= s.z1 ) lo = mid + 1;
        else return s;
    }
    return undefined;
}

export function lineAt( spans: readonly OpenSpan[], z: number, fallback: number ): number {
    return spanAt( spans, z )?.line ?? fallback;
}

export function strafeToward( s: SimShip, target: number, t: FlightTuning ): number {
    const e = target - s.x;
    const reach = Math.sqrt( 2 * t.strafeAccel * PILOT_BRAKE_SHARE * Math.abs( e ) );
    const want = Math.sign( e ) * Math.min( t.strafeClamp, reach );
    const dv = want - s.vx;
    const step = t.strafeAccel * FIXED_DT;
    if ( dv > step ) return 1;
    if ( dv < -step ) return -1;
    return 0;
}

function nextHole( holes: readonly Hole[], z: number ): number {
    for ( let i = 0; i < holes.length; i++ ) if ( holes[ i ].z1 > z ) return i;
    return -1;
}

function cloneWorld( w: SimWorld ): SimWorld {
    return { broken: new Set( w.broken ) };
}

function clears( p: Pilot, s: SimShip, world: SimWorld, hole: number, takeoffZ: number, mode: JumpMode ): boolean {
    const ship: SimShip = { ...s };
    const w = cloneWorld( world );
    const sub: Pilot = { ...p, predicting: true, plan: { hole, takeoffZ, mode, jp: newJumpPilot() } };
    const h = p.course.holes[ hole ];
    for ( let n = 0; n < PILOT_PREDICT_TICKS; n++ ) {
        const input = pilotInput( sub, ship, w );
        simulate( ship, input, FIXED_DT, p.tuning, p.track, undefined, w );
        if ( ship.dead ) return false;
        if ( ship.grounded && ship.z - p.tuning.halfL > h.z1 ) return true;
    }
    return false;
}

function planJump( p: Pilot, s: SimShip, world: SimWorld, hole: number ): JumpPlan {
    const h = p.course.holes[ hole ];
    const from = Math.max( s.z, h.z0 - PILOT_MAX_LEAD );
    for ( const mode of [ 'single', 'double' ] as const ) {
        const ok: number[] = [];
        for ( let z = from; z <= h.z0; z += PILOT_LEAD_STEP ) if ( clears( p, s, world, hole, z, mode ) ) ok.push( z );
        if ( ok.length > 0 ) return { hole, takeoffZ: ok[ Math.floor( ok.length / 2 ) ], mode, jp: newJumpPilot() };
    }
    return { hole, takeoffZ: h.z0 - p.tuning.halfL, mode: 'double', jp: newJumpPilot() };
}

function steerJumps( p: Pilot, s: SimShip, world: SimWorld, input: PlayerInput ): void {
    if ( p.plan?.jp.done && s.z > p.course.holes[ p.plan.hole ].z1 ) p.plan = null;
    if ( p.plan === null && ! p.predicting && s.grounded ) {
        const hole = nextHole( p.course.holes, s.z );
        const h = p.course.holes[ hole ];
        if ( h !== undefined && h.z0 - s.z <= Math.max( s.vz, 1 ) * PILOT_PLAN_S + p.tuning.halfL )
            p.plan = planJump( p, s, world, hole );
    }
    if ( p.plan === null ) return;
    steerJump( p.plan.jp, p.plan.mode, s, p.plan.takeoffZ );
    input.jump = p.plan.jp.input.jump;
}

export function pilotInput( p: Pilot, s: SimShip, world: SimWorld ): PlayerInput {
    if ( p.wasDead && ! s.dead ) p.plan = null;
    p.wasDead = s.dead;
    const input: PlayerInput = { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false };
    if ( s.dead ) return input;
    const look = s.z + Math.max( s.vz, 0 ) * PILOT_LOOK_S;
    input.strafe = strafeToward( s, lineAt( p.course.spans, look, s.x ), p.tuning );
    steerJumps( p, s, world, input );
    return input;
}
