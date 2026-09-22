import type { FlightTuning } from '@slur/shared';
import type * as THREE from 'three';
import { num } from '../../dev/tunables';

export interface AttitudeState {
    roll: number;
    rollVel: number;
    yaw: number;
    yawVel: number;
    pitch: number;
    pitchVel: number;
}

export interface BankTuning {
    roll: number;
    yaw: number;
    pitch: number;
    stiffness: number;
    damping: number;
}

const MAX_ATTITUDE_STEP = 1 / 30;

const scratch: BankTuning = { roll: 0, yaw: 0, pitch: 0, stiffness: 0, damping: 0 };

export function bankTuning(): BankTuning {
    scratch.roll = num( 'ship.bankRoll' );
    scratch.yaw = num( 'ship.bankYaw' );
    scratch.pitch = num( 'ship.bankPitch' );
    scratch.stiffness = num( 'ship.bankStiffness' );
    scratch.damping = num( 'ship.bankDamping' );
    return scratch;
}

function unit( v: number, ref: number ): number {
    if ( ref <= 0 ) return 0;
    const n = v / ref;
    return n < -1 ? -1 : n > 1 ? 1 : n;
}

export function driveAttitude(
    a: AttitudeState,
    grp: THREE.Object3D,
    vx: number,
    vy: number,
    t: FlightTuning,
    b: BankTuning,
    dt: number,
): void {
    const step = dt < MAX_ATTITUDE_STEP ? dt : MAX_ATTITUDE_STEP;
    const lateral = unit( vx, t.strafeClamp );
    const vertical = unit( vy, t.jumpImpulse );
    const c = 2 * Math.sqrt( b.stiffness ) * b.damping;

    a.rollVel += ( b.stiffness * ( -lateral * b.roll - a.roll ) - c * a.rollVel ) * step;
    a.roll += a.rollVel * step;

    a.yawVel += ( b.stiffness * ( lateral * b.yaw - a.yaw ) - c * a.yawVel ) * step;
    a.yaw += a.yawVel * step;

    a.pitchVel += ( b.stiffness * ( -vertical * b.pitch - a.pitch ) - c * a.pitchVel ) * step;
    a.pitch += a.pitchVel * step;

    grp.rotation.set( a.pitch, a.yaw, a.roll );
}
