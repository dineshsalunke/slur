// Phase-split kinematic step (semi-implicit Euler). Order: intents → velocity → gravity →
// integrate → collide. Each phase is a pure mutator so S3 can swap resolveCollisions for real
// track collision. Framework-free — operates on the plain SimShip.

import type { FlightTuning } from '../constants.js';
import type { PlayerInput } from './input.js';
import type { SimShip } from './types.js';

export function applyLongitudinal( s: SimShip, input: PlayerInput, t: FlightTuning, dt: number ): void {
    if ( input.throttle > 0 ) s.vz += t.accel * input.throttle * dt;
    if ( input.brake > 0 ) s.vz -= t.brakeDecel * input.brake * dt;
    if ( input.throttle === 0 && input.brake === 0 ) {
        const d = t.coastDrag * dt;
        s.vz = s.vz > d ? s.vz - d : 0;
    }
    let cap = t.maxCruise;
    if ( input.boost && s.energy > 0 ) {
        cap = t.maxCruise * t.boostMul;
        s.vz += t.boostAccel * dt;
        s.energy = Math.max( 0, s.energy - t.energyDrain * dt );
    } else {
        s.energy = Math.min( t.energyMax, s.energy + t.energyRegen * dt );
    }
    s.vz = Math.min( Math.max( s.vz, 0 ), cap );
}

export function applyStrafe( s: SimShip, input: PlayerInput, t: FlightTuning, dt: number ): void {
    if ( input.strafe !== 0 ) s.vx += t.strafeAccel * input.strafe * dt;
    else s.vx -= s.vx * Math.min( 1, t.strafeDamp * dt );
    s.vx = Math.min( Math.max( s.vx, -t.strafeClamp ), t.strafeClamp );
}

// Consume a buffered jump: first jump off ground/coyote, else a double jump while airborne.
function consumeBufferedJump( s: SimShip, t: FlightTuning ): void {
    const canGround = s.grounded || s.coyoteTimer > 0;
    if ( canGround && s.jumpsUsed === 0 ) {
        s.vy = t.jumpImpulse;
        s.jumpsUsed = 1;
        s.grounded = false;
        s.coyoteTimer = 0;
        s.bufferTimer = 0;
    } else if ( ! canGround && s.jumpsUsed < t.maxJumps ) {
        if ( s.jumpsUsed === 0 ) s.jumpsUsed = 1;
        s.vy = t.doubleJumpImpulse;
        s.jumpsUsed += 1;
        s.bufferTimer = 0;
    }
}

export function applyJump( s: SimShip, input: PlayerInput, t: FlightTuning, dt: number ): void {
    s.coyoteTimer = s.grounded ? t.coyoteTime : Math.max( 0, s.coyoteTimer - dt );
    s.bufferTimer = Math.max( 0, s.bufferTimer - dt );
    if ( input.jump && ! s.jumpHeld ) s.bufferTimer = t.jumpBuffer; // buffer a fresh press
    if ( ! input.jump && s.jumpHeld && s.vy > t.minJumpVel ) s.vy = t.minJumpVel; // early release → short hop (min height)
    if ( s.bufferTimer > 0 ) consumeBufferedJump( s, t );
    s.jumpHeld = input.jump;
}

export function applyGravity( s: SimShip, t: FlightTuning, dt: number ): void {
    s.vy -= ( s.vy > 0 ? t.riseGravity : t.fallGravity ) * dt; // asymmetric: fall faster than rise
}

export function integrate( s: SimShip, dt: number ): void {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
}

// S3 replaces this with real track collision. For now: flat floor at y=0 + side walls.
export function resolveCollisions( s: SimShip, t: FlightTuning ): void {
    if ( s.y <= 0 ) {
        s.y = 0;
        if ( s.vy < 0 ) s.vy = 0;
        s.grounded = true;
        s.jumpsUsed = 0;
    } else {
        s.grounded = false;
    }
    if ( s.x < -t.halfWidth ) {
        s.x = -t.halfWidth;
        if ( s.vx < 0 ) s.vx = 0;
    } else if ( s.x > t.halfWidth ) {
        s.x = t.halfWidth;
        if ( s.vx > 0 ) s.vx = 0;
    }
}

export function stepShip( s: SimShip, input: PlayerInput, dt: number, t: FlightTuning ): void {
    applyLongitudinal( s, input, t, dt );
    applyStrafe( s, input, t, dt );
    applyJump( s, input, t, dt );
    applyGravity( s, t, dt );
    integrate( s, dt );
    resolveCollisions( s, t );
}
