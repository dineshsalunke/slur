export interface ShipFrame {
    vy: number;
    vz: number;
    grounded: boolean;
    jumpsUsed: number;
    dead: boolean;
}

export interface MoveTuning {
    maxCruise: number;
    jumpImpulse: number;
    heavy: boolean;
}

export type MoveCue = { sfx: 'jump'; rate: number } | { sfx: 'land'; gain: number; rate: number } | { sfx: 'brake' };

export interface MoveEdges {
    jumps: number;
    grounded: boolean;
    airVy: number;
    braking: boolean;
    live: boolean;
}

export const DOUBLE_JUMP_RATE = 1.12;
export const HEAVY_LAND_RATE = 0.85;
export const LAND_GAIN_MIN = 0.4;
export const BRAKE_MIN_SPEED = 0.3;

const NONE: readonly MoveCue[] = [];

export function createMoveEdges(): MoveEdges {
    return { jumps: 0, grounded: true, airVy: 0, braking: false, live: false };
}

export function stepMoveEdges( e: MoveEdges, s: ShipFrame, brake: number, t: MoveTuning ): readonly MoveCue[] {
    const braking = brake > 0;
    if ( s.dead || ! e.live ) {
        e.jumps = s.jumpsUsed;
        e.grounded = s.grounded;
        e.airVy = 0;
        e.braking = braking;
        e.live = ! s.dead;
        return NONE;
    }
    let cues: MoveCue[] | null = null;
    if ( s.jumpsUsed > e.jumps ) {
        cues ??= [];
        cues.push( { sfx: 'jump', rate: s.jumpsUsed > 1 ? DOUBLE_JUMP_RATE : 1 } );
    }
    if ( ! s.grounded ) e.airVy = Math.min( e.airVy, s.vy );
    if ( s.grounded && ! e.grounded ) {
        const ref = t.jumpImpulse > 0 ? t.jumpImpulse : 1;
        const gain = Math.min( Math.max( -e.airVy / ref, LAND_GAIN_MIN ), 1 );
        cues ??= [];
        cues.push( { sfx: 'land', gain, rate: t.heavy ? HEAVY_LAND_RATE : 1 } );
        e.airVy = 0;
    }
    if ( braking && ! e.braking && s.vz > BRAKE_MIN_SPEED * t.maxCruise ) {
        cues ??= [];
        cues.push( { sfx: 'brake' } );
    }
    e.jumps = s.jumpsUsed;
    e.grounded = s.grounded;
    e.braking = braking;
    return cues ?? NONE;
}

export interface PassFrame {
    x: number;
    z: number;
    vz: number;
}

export interface PassState {
    armed: boolean;
}

export const PASS_DX = 12;
export const PASS_LEAD_S = 0.45;
export const PASS_REARM_DZ = 20;
export const PASS_MIN_CLOSING = 5;

export function passByEdge( st: PassState, me: PassFrame, other: PassFrame ): boolean {
    const dz = other.z - me.z;
    if ( ! st.armed ) {
        st.armed = Math.abs( dz ) > PASS_REARM_DZ;
        return false;
    }
    const closing = me.vz - other.vz;
    if ( Math.abs( other.x - me.x ) >= PASS_DX || Math.abs( closing ) < PASS_MIN_CLOSING ) return false;
    const lead = dz / closing;
    if ( lead <= 0 || lead >= PASS_LEAD_S ) return false;
    st.armed = false;
    return true;
}
