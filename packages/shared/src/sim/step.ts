import { hopThroughPortal } from '../combat/portal.js';
import { type FlightTuning, STRAFE_PRESS } from '../constants.js';
import { clearFeatures, featureCap, featureInput, featureThrust, tickFeatures } from '../features/sim-hooks.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import type { PlayerInput } from './input.js';
import { respawnPoint } from './respawn-point.js';
import { type Block, HALF_WIDTH, type Segment, spanHasZ, spanOverlapsZ, type Track } from './space.js';
import { clearStatus, tickStatus } from './status.js';
import type { SimShip, SimWorld } from './types.js';

const NEUTRAL_INPUT: PlayerInput = { seq: 0, throttle: 0, brake: 0, strafe: 0, jump: false };

const BOUNCE_CLEARANCE = 1e-3;
const CONTACTS = {
    hit: { [ -1 ]: { kind: 'hit', dir: -1 }, 1: { kind: 'hit', dir: 1 } },
    scrape: { [ -1 ]: { kind: 'scrape', dir: -1 }, 1: { kind: 'scrape', dir: 1 } },
} as const satisfies Record< BlockContact[ 'kind' ], Record< BlockContact[ 'dir' ], BlockContact > >;
const DECK_Y = 0;

export function boostCap( s: SimShip, t: FlightTuning, cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    if ( s.boostTimer <= 0 ) return t.maxCruise;
    const ease = cfg.boostEaseS > 0 ? Math.min( 1, s.boostTimer / cfg.boostEaseS ) : 1;
    return t.maxCruise * ( 1 + cfg.boostGain * ease );
}

export function boostThrust(
    s: SimShip,
    input: PlayerInput,
    t: FlightTuning,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): number {
    if ( s.boostTimer <= 0 || s.stunTimer > 0 || input.brake > 0 || cfg.boostRiseS <= 0 ) return 0;
    return ( cfg.boostGain * t.maxCruise ) / cfg.boostRiseS;
}

export function applyLongitudinal(
    s: SimShip,
    input: PlayerInput,
    t: FlightTuning,
    dt: number,
    cap = t.maxCruise,
    push = 0,
): void {
    if ( push > 0 ) s.vz += push * dt;
    if ( input.throttle > 0 ) s.vz += t.accel * input.throttle * dt;
    if ( input.brake > 0 ) s.vz = Math.max( 0, s.vz - t.brakeDecel * input.brake * dt );
    if ( push === 0 && input.throttle === 0 && input.brake === 0 ) {
        const d = t.coastDrag * dt;
        if ( s.vz > d ) s.vz -= d;
        else if ( s.vz < -d ) s.vz += d;
        else s.vz = 0;
    }
    s.vz = Math.min( Math.max( s.vz, -t.bounceBack ), cap );
}

function rampStrafe( s: SimShip, input: PlayerInput, t: FlightTuning, dt: number ): void {
    if ( input.strafe !== 0 ) {
        s.vx += t.strafeAccel * input.strafe * dt;
        const kick = t.strafeKick * input.strafe;
        if ( t.strafeKick > 0 && ( input.strafe > 0 ? s.vx < kick : s.vx > kick ) ) s.vx = kick;
    } else s.vx -= s.vx * Math.min( 1, t.strafeDamp * dt );
}

export function strafePress( strafe: number ): number {
    return Math.abs( strafe ) >= STRAFE_PRESS ? Math.sign( strafe ) : 0;
}

export function cancelKick( s: SimShip ): void {
    s.strafeHeld = 0;
    s.kickLeft = 0;
    s.kicking = false;
}

function startKick( s: SimShip, press: number, t: FlightTuning ): void {
    if ( t.kickDistance <= 0 || t.strafeKick <= 0 || press === 0 || press === s.strafeHeld ) return;
    if ( s.vx * press > t.strafeKick ) return;
    s.kickLeft = s.kickLeft * press > 0 ? s.kickLeft + press * t.kickDistance : press * t.kickDistance;
}

function clampStrafe( vx: number, t: FlightTuning ): number {
    return Math.min( Math.max( vx, -t.strafeClamp ), t.strafeClamp );
}

function driveKick( s: SimShip, press: number, t: FlightTuning, dt: number ): void {
    const dir = Math.sign( s.kickLeft );
    const left = Math.abs( s.kickLeft );
    const held = press === dir;
    const step = held ? t.strafeKick * dt : Math.min( left, t.strafeKick * dt );
    s.kickLeft = step >= left ? 0 : s.kickLeft - dir * step;
    s.vx = clampStrafe( ( dir * step ) / dt, t );
    s.kicking = ! held;
}

export function applyStrafe( s: SimShip, input: PlayerInput, t: FlightTuning, dt: number ): void {
    if ( s.stunTimer > 0 ) cancelKick( s );
    const press = strafePress( input.strafe );
    startKick( s, press, t );
    s.strafeHeld = press;
    if ( s.kickLeft !== 0 ) {
        driveKick( s, press, t, dt );
        return;
    }
    if ( s.kicking && press === 0 ) s.vx = 0;
    else rampStrafe( s, input, t, dt );
    s.kicking = false;
    s.vx = clampStrafe( s.vx, t );
}

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
    if ( input.jump && ! s.jumpHeld ) s.bufferTimer = t.jumpBuffer;
    if ( ! input.jump && s.jumpHeld && s.vy > t.minJumpVel ) s.vy = t.minJumpVel;
    if ( s.bufferTimer > 0 ) consumeBufferedJump( s, t );
    s.jumpHeld = input.jump;
}

export function applyGravity( s: SimShip, t: FlightTuning, dt: number ): void {
    s.vy -= ( s.vy > 0 ? t.riseGravity : t.fallGravity ) * dt;
}

export function integrate( s: SimShip, dt: number ): void {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
}

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

function deckLimit( t: FlightTuning ): number {
    return HALF_WIDTH - t.halfW;
}

function clampToEdges( s: SimShip, t: FlightTuning ): void {
    const limit = deckLimit( t );
    if ( s.x < -limit ) {
        s.x = -limit;
        if ( s.vx < 0 ) s.vx = 0;
    } else if ( s.x > limit ) {
        s.x = limit;
        if ( s.vx > 0 ) s.vx = 0;
    }
}

export function floorUnder( seg: Segment, x: number, z: number, y: number, stepTol: number ): number | null {
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( ! spanHasZ( seg, f, z ) ) continue;
        if ( x >= f.x0 && x <= f.x1 && f.y <= y + stepTol ) {
            if ( best === null || f.y > best ) best = f.y;
        }
    }
    return best;
}

function footprintSegs( track: Track, z: number, halfL: number ): Segment[] {
    const a = track.segmentAtZ( z - halfL );
    const b = track.segmentAtZ( z + halfL );
    return a.index === b.index ? [ a ] : [ a, b ];
}

function bestFloorInSeg( seg: Segment, s: SimShip, prevY: number, t: FlightTuning ): number | null {
    if ( s.z + t.halfL <= seg.z0 || s.z - t.halfL >= seg.z1 ) return null;
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( ! spanOverlapsZ( seg, f, s.z - t.halfL, s.z + t.halfL ) ) continue;
        if ( s.x + t.halfW <= f.x0 || s.x - t.halfW >= f.x1 ) continue;
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

function onBoostDeck( s: SimShip, prevY: number, t: FlightTuning ): boolean {
    return s.glideTimer > 0 && Math.abs( s.x ) <= HALF_WIDTH && s.y <= DECK_Y && prevY + t.stepTol >= DECK_Y;
}

function markDead( s: SimShip, t: FlightTuning ): void {
    s.dead = true;
    clearStatus( s );
    clearFeatures( s );
    cancelKick( s );
    s.respawnTimer = t.respawnDelay;
    s.vx = 0;
    s.vy = 0;
    s.vz = 0;
}

function respawn( s: SimShip, track: Track, t: FlightTuning ): void {
    s.dead = false;
    const p = respawnPoint( track, s.lastSafeX, s.lastSafeZ - t.respawnSetback, t );
    s.x = p.x;
    s.z = p.z;
    s.y = floorUnder( track.segmentAtZ( p.z ), p.x, p.z, Number.POSITIVE_INFINITY, t.stepTol ) ?? 0;
    s.vx = 0;
    s.vy = 0;
    s.vz = t.respawnVz;
    s.grounded = true;
    s.jumpsUsed = 0;
    s.stunTimer = 0;
    clearStatus( s );
    clearFeatures( s );
    cancelKick( s );
}

function overlapsBlock( b: Block, s: SimShip, prevY: number, t: FlightTuning ): boolean {
    return (
        s.x + t.halfW > b.x0 &&
        s.x - t.halfW < b.x1 &&
        s.z + t.halfL > b.z0 &&
        s.z - t.halfL < b.z1 &&
        s.y < b.y1 &&
        prevY + t.stepTol >= b.y0
    );
}

export interface BlockContact {
    kind: 'hit' | 'scrape';
    dir: -1 | 1;
}

export type Contact = BlockContact | null;

interface BlockPush {
    axis: 'x' | 'z';
    delta: number;
    fresh: boolean;
}

function nearer( a: number, b: number ): number {
    return Math.abs( a ) <= Math.abs( b ) ? a : b;
}

function outsideSpan( c: number, half: number, lo: number, hi: number ): boolean {
    return c + half <= lo || c - half >= hi;
}

function entryFraction( p: number, c: number, half: number, lo: number, hi: number ): number {
    const d = c - p;
    return d > 0 ? ( lo - ( p + half ) ) / d : ( hi - ( p - half ) ) / d;
}

function sideGap( b: Block, prevX: number, delta: number, t: FlightTuning ): number {
    return delta < 0 ? b.x0 - ( prevX + t.halfW ) : prevX - t.halfW - b.x1;
}

function entryPush( b: Block, s: SimShip, prevX: number, prevZ: number, t: FlightTuning ): BlockPush {
    const xDelta = nearer( b.x0 - ( s.x + t.halfW ), b.x1 - ( s.x - t.halfW ) );
    const zDelta = nearer( b.z0 - ( s.z + t.halfL ), b.z1 - ( s.z - t.halfL ) );
    const side: BlockPush = {
        axis: 'x',
        delta: xDelta,
        fresh: sideGap( b, prevX, xDelta, t ) > 2 * BOUNCE_CLEARANCE,
    };
    const end: BlockPush =
        Math.abs( xDelta ) < t.grazeDepth
            ? { axis: 'x', delta: xDelta, fresh: true }
            : { axis: 'z', delta: zDelta, fresh: true };
    const fromSide = outsideSpan( prevX, t.halfW, b.x0, b.x1 );
    const fromEnd = outsideSpan( prevZ, t.halfL, b.z0, b.z1 );
    if ( fromSide && fromEnd ) {
        const fx = entryFraction( prevX, s.x, t.halfW, b.x0, b.x1 );
        const fz = entryFraction( prevZ, s.z, t.halfL, b.z0, b.z1 );
        return fx > fz ? side : end;
    }
    if ( fromEnd ) return end;
    if ( fromSide ) return side;
    return Math.abs( xDelta ) <= Math.abs( zDelta )
        ? { axis: 'x', delta: xDelta, fresh: false }
        : { axis: 'z', delta: zDelta, fresh: true };
}

function breakable( b: Block, world: SimWorld | undefined ): boolean {
    return world !== undefined && b.kind === 'fractured';
}

function standing( b: Block, world: SimWorld | undefined ): boolean {
    return world === undefined || ! world.broken.has( b.id );
}

function smashThrough( segs: Segment[], s: SimShip, prevY: number, t: FlightTuning, world: SimWorld ): void {
    for ( const seg of segs ) {
        for ( const b of seg.blocks ) {
            if ( b.kind !== 'fractured' || world.broken.has( b.id ) || ! overlapsBlock( b, s, prevY, t ) ) continue;
            world.broken.add( b.id );
            s.vz *= t.smashKeep;
        }
    }
}

function blockPush(
    segs: Segment[],
    s: SimShip,
    prevX: number,
    prevY: number,
    prevZ: number,
    t: FlightTuning,
    world: SimWorld | undefined,
): BlockPush | null {
    let best: BlockPush | null = null;
    for ( const seg of segs ) {
        for ( const b of seg.blocks ) {
            if ( breakable( b, world ) || ! standing( b, world ) || ! overlapsBlock( b, s, prevY, t ) ) continue;
            const p = entryPush( b, s, prevX, prevZ, t );
            if ( best === null || Math.abs( p.delta ) < Math.abs( best.delta ) ) best = p;
        }
    }
    return best;
}

function bounceOffBlock( s: SimShip, push: BlockPush, t: FlightTuning ): Contact {
    const dir = push.delta < 0 ? -1 : 1;
    const stunned = s.stunTimer > 0;
    const kick = stunned ? 0 : t.bounceBack;
    if ( push.axis === 'x' ) {
        s.x += push.delta + dir * BOUNCE_CLEARANCE;
        if ( s.vx * dir < 0 ) s.vx = dir * kick;
        if ( ! push.fresh ) return null;
        if ( s.vz > 0 ) s.vz *= t.scrapeKeep;
        return CONTACTS.scrape[ dir ];
    }
    s.z += push.delta + dir * BOUNCE_CLEARANCE;
    if ( s.vz * dir < 0 ) s.vz = dir * kick;
    if ( stunned ) return null;
    s.stunTimer = t.bounceStun;
    return CONTACTS.hit[ dir ];
}

export function resolveCollisions(
    s: SimShip,
    prevX: number,
    prevY: number,
    prevZ: number,
    track: Track,
    t: FlightTuning,
    world?: SimWorld,
): Contact {
    const segs = footprintSegs( track, s.z, t.halfL );

    const floorY = landingFloor( segs, s, prevY, t );
    if ( floorY !== null ) {
        s.y = floorY;
        if ( s.vy < 0 ) s.vy = 0;
        s.grounded = true;
        s.jumpsUsed = 0;
        s.lastSafeX = s.x;
        s.lastSafeZ = s.z;
    } else if ( onBoostDeck( s, prevY, t ) ) {
        s.y = DECK_Y;
        if ( s.vy < 0 ) s.vy = 0;
        s.grounded = true;
        s.jumpsUsed = 0;
    } else {
        s.grounded = false;
    }

    if ( s.y < t.deathY ) {
        markDead( s, t );
        return null;
    }

    if ( world !== undefined ) smashThrough( segs, s, prevY, t, world );
    const push = blockPush( segs, s, prevX, prevY, prevZ, t, world );
    const contact = push === null ? null : bounceOffBlock( s, push, t );

    if ( track.segmentAtZ( s.z ).isFinish && s.z >= track.finishZ && ! s.finished ) s.finished = true;
    return contact;
}

export function simulate(
    s: SimShip,
    input: PlayerInput,
    dt: number,
    t: FlightTuning,
    track?: Track,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    world?: SimWorld,
): Contact {
    if ( s.dead ) {
        s.respawnTimer -= dt;
        if ( s.respawnTimer <= 0 ) {
            if ( track ) respawn( s, track, t );
            else s.dead = false;
        }
        return null;
    }

    const control = featureInput( s, s.stunTimer > 0 ? NEUTRAL_INPUT : input, cfg );
    const push = boostThrust( s, input, t, cfg ) + featureThrust( s, input, t, cfg );
    const cap = featureCap( s, t, boostCap( s, t, cfg ), cfg );
    tickStatus( s, dt, cfg );
    tickFeatures( s, t, dt, cfg );

    applyLongitudinal( s, control, t, dt, cap, push );
    applyStrafe( s, control, t, dt );
    applyJump( s, control, t, dt );
    applyGravity( s, t, dt );
    const prevX = s.x;
    const prevY = s.y;
    const prevZ = s.z;
    integrate( s, dt );
    let contact: Contact = null;
    if ( track ) contact = resolveCollisions( s, prevX, prevY, prevZ, track, t, world );
    else resolveFlatFloor( s, t );
    if ( world && world.portals.size > 0 ) hopThroughPortal( s, prevZ, t, world.portals.values(), cfg );
    return contact;
}
