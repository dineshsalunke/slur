// Phase-split kinematic step (semi-implicit Euler). Order: intents → velocity → gravity →
// integrate → collide. Each phase is a pure mutator so S3 can swap resolveCollisions for real
// track collision. Framework-free — operates on the plain SimShip.

import type { FlightTuning } from '../constants.js';
import type { PlayerInput } from './input.js';
import type { Segment, Track } from './track.js';
import type { SimShip } from './types.js';

// Neutral intent used while STUNNED — a module const (emptyInput-style, no per-tick allocation). Fed to the
// control phases so a stunned ship coasts + drifts; gravity/integrate/collision still run on its real state.
const NEUTRAL_INPUT: PlayerInput = { seq: 0, throttle: 0, brake: 0, strafe: 0, jump: false };

export function applyLongitudinal( s: SimShip, input: PlayerInput, t: FlightTuning, dt: number ): void {
    if ( input.throttle > 0 ) s.vz += t.accel * input.throttle * dt;
    if ( input.brake > 0 ) s.vz -= t.brakeDecel * input.brake * dt;
    if ( input.throttle === 0 && input.brake === 0 ) {
        const d = t.coastDrag * dt;
        s.vz = s.vz > d ? s.vz - d : 0;
    }
    s.vz = Math.min( Math.max( s.vz, 0 ), t.maxCruise );
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

// Edge walls: STOP + slide (S1 behavior) — edges don't kill, else strafing is punishing. AABB: clamp the
// WING (x ± halfW) inside the rail, so the visible hull never pokes past the track edge.
function clampToEdges( s: SimShip, t: FlightTuning ): void {
    const limit = t.halfWidth - t.halfW;
    if ( s.x < -limit ) {
        s.x = -limit;
        if ( s.vx < 0 ) s.vx = 0;
    } else if ( s.x > limit ) {
        s.x = limit;
        if ( s.vx > 0 ) s.vx = 0;
    }
}

// Highest floor under the ship's lateral x, ignoring height — used by respawn() to find ground to
// drop onto. Returns null only if x is over a genuine gap (no floor spans it).
function floorUnder( seg: Segment, x: number, y: number, stepTol: number ): number | null {
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( x >= f.x0 && x <= f.x1 && f.y <= y + stepTol ) {
            if ( best === null || f.y > best ) best = f.y;
        }
    }
    return best;
}

// Segments the ship's z-footprint [z−halfL, z+halfL] touches. At most 2 (halfL ≪ SEG_LEN), deduped by index.
function footprintSegs( track: Track, z: number, halfL: number ): Segment[] {
    const a = track.segmentAtZ( z - halfL );
    const b = track.segmentAtZ( z + halfL );
    return a.index === b.index ? [ a ] : [ a, b ];
}

// SWEPT + AABB landing test: the highest floor the ship's footprint crossed downward this tick. GENEROUS
// grounded rule — ANY part of the footprint (x ± halfW, over a z-overlapping segment) above a floor supports
// the WHOLE ship. That gives later takeoff / earlier landing across gaps (effective gap = SEG_LEN − 2·halfL).
// Keyed off prevY (not the landed y) so a fast fall overshooting the top by > stepTol still lands — no
// tunnelling. stepTol is also the highest ledge you can step UP onto; coming from > stepTol below = you were
// underneath, so you pass through.
// Highest floor in ONE segment the footprint swept onto (null if none / no z-overlap). See landingFloor.
function bestFloorInSeg( seg: Segment, s: SimShip, prevY: number, t: FlightTuning ): number | null {
    if ( s.z + t.halfL <= seg.z0 || s.z - t.halfL >= seg.z1 ) return null; // no z-overlap with this segment
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( s.x + t.halfW <= f.x0 || s.x - t.halfW >= f.x1 ) continue; // no x-overlap with this span
        if ( prevY + t.stepTol >= f.y && s.y <= f.y && ( best === null || f.y > best ) ) best = f.y;
    }
    return best;
}

function landingFloor( segs: Segment[], s: SimShip, prevY: number, t: FlightTuning ): number | null {
    let best: number | null = null;
    for ( const seg of segs ) {
        const f = bestFloorInSeg( seg, s, prevY, t );
        if ( f !== null && ( best === null || f > best ) ) best = f;
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
    s.stunTimer = 0; // a derezzed ship wakes up unfrozen — a stun never carries across a respawn
}

// Does the ship's footprint (x ± halfW, z ± halfL) overlap a lethal cube it's inside? Cubes are taller than
// any jump (un-jumpable by design), so any footprint overlap on the ground is a crash — the strafe-or-die
// contract; there is no "land on top". Bounds:
//   • Upper STRICT (`s.y < b.y1`): a legit landing onto a raised floor snaps to exactly that floor's y;
//     being below a cube's top with no such floor = inside the solid → dead.
//   • Lower SWEPT (`prevY`, not s.y): a ground-level ship nudged just under a body base by one tick of
//     gravity still registers (came from ≥ base), while a future FLOATING body (y0 > 0) can be passed under
//     from genuinely below.
function hitsLethalBody( segs: Segment[], s: SimShip, prevY: number, t: FlightTuning ): boolean {
    for ( const seg of segs ) {
        for ( const b of seg.blocks ) {
            if (
                s.x + t.halfW > b.x0 &&
                s.x - t.halfW < b.x1 &&
                s.z + t.halfL > b.z0 &&
                s.z - t.halfL < b.z1 &&
                s.y < b.y1 &&
                prevY + t.stepTol >= b.y0
            ) {
                return true;
            }
        }
    }
    return false;
}

// S3 track collision, AABB (footprint = the ship's model box, halfW × halfL). Floor support (land + reset
// jump), gap → fall → death, lethal cube overlap → death, edge walls stop, finish gate latches `finished`.
// Replaces the S1 flat floor. Preserves the grounded/jumpsUsed reset contract (jump breaks otherwise).
export function resolveCollisions( s: SimShip, prevY: number, track: Track, t: FlightTuning ): void {
    const segs = footprintSegs( track, s.z, t.halfL );

    const floorY = landingFloor( segs, s, prevY, t );
    if ( floorY !== null ) {
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

    const insideBody = hitsLethalBody( segs, s, prevY, t );
    // Post-respawn grace is POSITION-scoped, not just timed: it only spares the body we respawned into,
    // and ENDS the first tick we're clear of every body — otherwise a respawned ship flies straight
    // through the NEXT cube. Blind time-based invuln was exactly that bug. (Falling still kills — above.)
    if ( insideBody ) {
        if ( s.invulnTimer <= 0 ) {
            markDead( s, t );
            return;
        }
    } else {
        s.invulnTimer = 0;
    }

    clampToEdges( s, t );

    if ( track.segmentAtZ( s.z ).isFinish && s.z >= track.finishZ && ! s.finished ) s.finished = true;
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

    // Stunned (bolt hit): freeze CONTROL — feed the intent phases a neutral input so the ship coasts +
    // drifts, while gravity/integrate/collision below still run (§5.4: the track does the killing, not the
    // bolt). Decrement deterministically so client replay re-freezes the exact same ticks the server did.
    const control = s.stunTimer > 0 ? NEUTRAL_INPUT : input;
    if ( s.stunTimer > 0 ) s.stunTimer = Math.max( 0, s.stunTimer - dt );

    applyLongitudinal( s, control, t, dt );
    applyStrafe( s, control, t, dt );
    applyJump( s, control, t, dt );
    applyGravity( s, t, dt );
    const prevY = s.y; // pre-integrate y → swept landing (see landingFloor); catches fast-fall overshoot
    integrate( s, dt );
    if ( track ) resolveCollisions( s, prevY, track, t );
    else resolveFlatFloor( s, t );

    if ( s.invulnTimer > 0 ) s.invulnTimer -= dt;
}
