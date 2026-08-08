// Phase-split kinematic step (semi-implicit Euler). Order: intents → velocity → gravity →
// integrate → collide. Each phase is a pure mutator so S3 can swap resolveCollisions for real
// track collision. Framework-free — operates on the plain SimShip.

import type { FlightTuning } from '../constants.js';
import type { PlayerInput } from './input.js';
import type { Segment, Track } from './track.js';
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

// Legacy S1 collision: an INFINITE flat floor at y=0 + side walls. Kept for /solo, which runs
// simulate() with no track. Owns the grounded/jumpsUsed reset that makes jump work.
function resolveFlatFloor( s: SimShip, t: FlightTuning ): void {
    if ( s.y <= 0 ) {
        s.y = 0;
        if ( s.vy < 0 ) s.vy = 0;
        s.grounded = true;
        s.jumpsUsed = 0;
        s.lastSafeX = s.x;
        s.lastSafeZ = s.z;
    } else {
        s.grounded = false;
    }
    clampToEdges( s, t );
}

// Edge walls: STOP + slide (S1 behavior) — edges don't kill, else strafing is punishing.
function clampToEdges( s: SimShip, t: FlightTuning ): void {
    if ( s.x < -t.halfWidth ) {
        s.x = -t.halfWidth;
        if ( s.vx < 0 ) s.vx = 0;
    } else if ( s.x > t.halfWidth ) {
        s.x = t.halfWidth;
        if ( s.vx > 0 ) s.vx = 0;
    }
}

// Highest landable floor height under the ship's lateral x within reach (span.y <= s.y + stepTol so
// you can't clip up through a ledge from below), or null if the ship is over a gap here.
function floorUnder( seg: Segment, x: number, y: number, stepTol: number ): number | null {
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( x >= f.x0 && x <= f.x1 && f.y <= y + stepTol ) {
            if ( best === null || f.y > best ) best = f.y;
        }
    }
    return best;
}

function markDead( s: SimShip, t: FlightTuning ): void {
    s.dead = true;
    s.respawnTimer = t.respawnDelay;
    s.vx = 0;
    s.vy = 0;
    s.vz = 0;
}

// Reposition to the last safe ground, stepped back so you re-approach the hazard. Falls back to the
// exact last-safe point if the setback lands over a gap (guarantees floor under the respawn).
function respawn( s: SimShip, track: Track, t: FlightTuning ): void {
    s.dead = false;
    s.x = s.lastSafeX;
    let z = s.lastSafeZ - t.respawnSetback;
    let floorY = floorUnder( track.segmentAtZ( z ), s.x, Number.POSITIVE_INFINITY, t.stepTol );
    if ( floorY === null ) {
        z = s.lastSafeZ; // setback fell in a gap → land exactly where we last stood
        floorY = floorUnder( track.segmentAtZ( z ), s.x, Number.POSITIVE_INFINITY, t.stepTol ) ?? 0;
    }
    s.z = z;
    s.y = floorY;
    s.vx = 0;
    s.vy = 0;
    s.vz = t.respawnVz;
    s.grounded = true;
    s.jumpsUsed = 0;
    s.invulnTimer = t.invulnTime;
}

// S3 track collision: per-tile floor (land + reset jump), gap → fall → death, block AABB → death,
// edge walls stop, finish gate latches `finished`. Replaces the S1 flat floor. Preserves the
// grounded/jumpsUsed reset contract (jump breaks otherwise).
export function resolveCollisions( s: SimShip, track: Track, t: FlightTuning ): void {
    const seg = track.segmentAtZ( s.z );

    const floorY = floorUnder( seg, s.x, s.y, t.stepTol );
    if ( floorY !== null && s.y <= floorY ) {
        s.y = floorY;
        if ( s.vy < 0 ) s.vy = 0;
        s.grounded = true;
        s.jumpsUsed = 0;
        s.lastSafeX = s.x;
        s.lastSafeZ = s.z;
    } else {
        s.grounded = false;
    }

    // Fell through a gap → death (invuln does NOT save you from falling).
    if ( s.y < t.deathY ) {
        markDead( s, t );
        return;
    }

    // Lethal block AABB (skipped during post-respawn invuln). Upper bound is STRICT (`< b.y1`) so that
    // standing ON a platform's top (its floor sits exactly at b.y1) is safe, while hitting the face
    // from below (y < top) crashes — that's the "jump onto it or crash" contract.
    if ( s.invulnTimer <= 0 ) {
        for ( const b of seg.blocks ) {
            if ( s.x >= b.x0 && s.x <= b.x1 && s.y >= b.y0 && s.y < b.y1 ) {
                markDead( s, t );
                return;
            }
        }
    }

    clampToEdges( s, t );

    if ( seg.isFinish && s.z >= track.finishZ && ! s.finished ) s.finished = true;
}

// The shared authoritative step: one fixed-dt advance of a ship from its input. Imported by both
// the client (prediction) and the server (authority) — identical math, same dt. `track` is optional:
// with it, real S3 collision runs (networked /run); without it, the S1 flat floor (/solo, unchanged).
export function simulate( s: SimShip, input: PlayerInput, dt: number, t: FlightTuning, track?: Track ): void {
    // Dead: freeze the sim and count down to respawn (predicted locally, reconciled by the server —
    // deterministic track + inputs ⇒ both ends kill/respawn on the same tick, so no rubber-band).
    if ( s.dead ) {
        s.respawnTimer -= dt;
        if ( s.respawnTimer <= 0 ) {
            if ( track ) respawn( s, track, t );
            else s.dead = false; // no track (solo) → nothing to respawn onto; just clear
        }
        return;
    }

    applyLongitudinal( s, input, t, dt );
    applyStrafe( s, input, t, dt );
    applyJump( s, input, t, dt );
    applyGravity( s, t, dt );
    integrate( s, dt );
    if ( track ) resolveCollisions( s, track, t );
    else resolveFlatFloor( s, t );

    if ( s.invulnTimer > 0 ) s.invulnTimer -= dt;
}
