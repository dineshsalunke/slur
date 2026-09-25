import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import { BOLT_STREAK_LENGTH } from './combat-look';

export const SHOT_LAND_S = 0.25;
export const BACK_LAND_S = 0.12;
export const COLLAPSE_S = 0.05;
export const SETTLE_END_S = 0.32;
export const OPEN_END_S = DEFAULT_SIM_CONFIG.mineArmS;
export const SHOT_RISE = 1.5;
export const SHOT_LIFT = 0.6;
export const SPIKE_HEIGHT = 8;
export const SPIKE_RISE_S = 0.08;
export const SPIKE_LIFE_S = 0.2;
export const LAND_SQUASH = 0.8;

export interface MineThrow {
    bornAt: number;
    fromX: number;
    fromY: number;
    fromZ: number;
    dir: number;
}

export interface ThrowSource {
    x: number;
    y: number;
    z: number;
    halfL: number;
}

export interface MinePoint {
    x: number;
    y: number;
    z: number;
}

export interface ShotPose {
    x: number;
    y: number;
    z: number;
    traveled: number;
    pitch: number;
    dir: number;
}

export interface BodyPose {
    visible: boolean;
    squash: number;
    open: number;
}

export function landAt( t: MineThrow ): number {
    return t.dir < 0 ? BACK_LAND_S : SHOT_LAND_S;
}

export function throwFrom(
    out: MineThrow,
    mine: MinePoint & { armed: boolean },
    src: ThrowSource | null,
    now: number,
): MineThrow {
    if ( ! src || mine.armed ) {
        out.bornAt = Number.NEGATIVE_INFINITY;
        return out;
    }
    const dir = mine.z >= src.z ? 1 : -1;
    out.bornAt = now;
    out.fromX = src.x;
    out.fromY = src.y + SHOT_LIFT;
    out.fromZ = src.z + dir * src.halfL;
    out.dir = dir;
    return out;
}

export function shotAt( t: MineThrow, mine: MinePoint, age: number, out: ShotPose ): boolean {
    const land = landAt( t );
    if ( ! ( age >= 0 && age < land + COLLAPSE_S ) ) return false;
    const s = Math.min( 1, age / land );
    const rise = t.dir < 0 ? 0 : SHOT_RISE;
    const dx = mine.x - t.fromX;
    const dy = mine.y - t.fromY;
    const dz = mine.z - t.fromZ;
    out.x = t.fromX + dx * s;
    out.y = t.fromY + dy * s + 4 * rise * s * ( 1 - s );
    out.z = t.fromZ + dz * s;
    out.pitch = Math.atan2( dy + 4 * rise * ( 1 - 2 * s ), Math.hypot( dx, dz ) );
    const left = age > land ? 1 - ( age - land ) / COLLAPSE_S : 1;
    out.traveled = Math.min( BOLT_STREAK_LENGTH, Math.hypot( dx, dy, dz ) * s ) * left;
    out.dir = t.dir;
    return true;
}

export function spikeAt( t: MineThrow, mine: MinePoint, age: number, out: ShotPose ): boolean {
    const a = age - landAt( t );
    if ( ! ( a >= 0 && a < SPIKE_LIFE_S ) ) return false;
    const head = SPIKE_HEIGHT * Math.min( 1, a / SPIKE_RISE_S );
    const tail = a <= SPIKE_RISE_S ? 0 : ( SPIKE_HEIGHT * ( a - SPIKE_RISE_S ) ) / ( SPIKE_LIFE_S - SPIKE_RISE_S );
    out.x = mine.x;
    out.y = mine.y + head;
    out.z = mine.z;
    out.traveled = head - tail;
    out.pitch = Math.PI / 2;
    out.dir = 1;
    return true;
}

function unit( v: number ): number {
    return Math.min( 1, Math.max( 0, v ) );
}

export function bodyAt( t: MineThrow, age: number, out: BodyPose ): BodyPose {
    const land = landAt( t );
    out.visible = age >= land;
    const settle = unit( ( age - land ) / ( SETTLE_END_S - land ) );
    out.squash = LAND_SQUASH + ( 1 - LAND_SQUASH ) * settle;
    const o = unit( ( age - SETTLE_END_S ) / ( OPEN_END_S - SETTLE_END_S ) );
    out.open = 1 - ( 1 - o ) ** 3;
    return out;
}
