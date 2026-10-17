import { HeldPower, POWER_SLOTS } from '../../combat/constants.js';
import type { FireDir } from '../../combat/fire-dir.js';
import type { FireContext } from '../../run/combat.js';
import type { FireIntent } from '../../run/input-queue.js';
import type { PlayerState, RunState } from '../../schema.js';
import { tuningForShip } from '../../ship-classes.js';
import type { SimConfig } from '../../sim-config.js';
import type { HopOrigin, RunContext } from '../define-sim-feature.js';
import {
    PORTAL_FIZZLE_MESSAGE,
    PORTAL_HOP_MESSAGE,
    type PortalFizzleMessage,
    type PortalHopMessage,
} from './portal-constants.js';
import type { PortalSpot } from './portal-hop.js';
import { placePortalEnd } from './portal-place.js';
import { Portal } from './portal-schema.js';

export type PortalEnd = 'a' | 'b';

export interface PortalTap {
    slot: number;
    dir: FireDir;
    seq: number;
    end: PortalEnd;
}

export interface PortalRun {
    readonly taps: Map< string, PortalTap >;
    seq: number;
}

export function openPortalRun(): PortalRun {
    return { taps: new Map(), seq: 0 };
}

function setEnd( pair: Portal, end: PortalEnd, spot: PortalSpot, cfg: SimConfig ): void {
    const x = Math.fround( spot.x );
    const y = Math.fround( spot.y );
    const z = Math.fround( spot.z );
    if ( end === 'a' ) {
        pair.ax = x;
        pair.ay = y;
        pair.az = z;
        pair.armA = false;
        pair.armTimerA = cfg.portalArmS;
        return;
    }
    pair.bx = x;
    pair.by = y;
    pair.bz = z;
    pair.armB = false;
    pair.armTimerB = cfg.portalArmS;
}

function spotFor( ctx: FireContext, p: PlayerState, far: boolean, dir: FireDir ): PortalSpot | null {
    return placePortalEnd( p, tuningForShip( p.shipId ), far, dir, ctx.track, ctx.broken, ctx.config );
}

function dropSecondCharge( p: PlayerState ): void {
    for ( let i = 0; i < POWER_SLOTS; i++ ) if ( p.slots[ i ] === HeldPower.portalB ) p.slots[ i ] = HeldPower.none;
}

export function placePortal(
    ctx: FireContext,
    p: PlayerState,
    ownerId: string,
    slot: number,
    dir: FireDir,
): PortalEnd | null {
    const spot = spotFor( ctx, p, false, dir );
    if ( ! spot ) {
        const message: PortalFizzleMessage = { x: p.x, y: p.y, z: p.z, ownerId };
        ctx.broadcast( PORTAL_FIZZLE_MESSAGE, message );
        return null;
    }
    const pair = ctx.state.portals.get( ownerId );
    if ( p.slots[ slot ] === HeldPower.portalB && pair?.ends === 1 ) {
        setEnd( pair, 'b', spot, ctx.config );
        pair.ends = 2;
        pair.ttl = ctx.config.portalTtl;
        p.slots[ slot ] = HeldPower.none;
        return 'b';
    }
    dropSecondCharge( p );
    const fresh = new Portal();
    fresh.ownerId = ownerId;
    fresh.ends = 1;
    fresh.ttl = ctx.config.portalTtl;
    setEnd( fresh, 'a', spot, ctx.config );
    ctx.state.portals.set( ownerId, fresh );
    p.slots[ slot ] = HeldPower.portalB;
    return 'a';
}

export function isDoubleTap( tap: PortalTap, intent: FireIntent, cfg: SimConfig ): boolean {
    const ticks = intent.seq - tap.seq;
    return tap.slot === intent.slot && tap.dir === intent.dir && ticks >= 0 && ticks <= cfg.portalDoubleTapTicks;
}

export function throwPortalFar( ctx: FireContext, p: PlayerState, ownerId: string, tap: PortalTap ): boolean {
    const pair = ctx.state.portals.get( ownerId );
    if ( ! pair || p.dead || p.spectating || p.stunTimer > 0 ) return false;
    if ( tap.end === 'b' && pair.ends < 2 ) return false;
    const spot = spotFor( ctx, p, true, tap.dir );
    if ( spot ) setEnd( pair, tap.end, spot, ctx.config );
    return true;
}

export function tapPortal(
    ctx: RunContext,
    run: PortalRun,
    p: PlayerState,
    ownerId: string,
    intent: FireIntent,
): boolean {
    run.seq = intent.seq;
    const tap = run.taps.get( ownerId );
    run.taps.delete( ownerId );
    return tap !== undefined && isDoubleTap( tap, intent, ctx.config ) && throwPortalFar( ctx, p, ownerId, tap );
}

export function usePortal(
    ctx: RunContext,
    run: PortalRun,
    p: PlayerState,
    ownerId: string,
    slot: number,
    dir: FireDir,
): boolean {
    ctx.nextId();
    const end = placePortal( ctx, p, ownerId, slot, dir );
    if ( end ) run.taps.set( ownerId, { slot, dir, seq: run.seq, end } );
    return false;
}

export function stepPortals( state: RunState, dt: number ): void {
    const expired: string[] = [];
    state.portals.forEach( ( pair, ownerId ) => {
        pair.ttl -= dt;
        if ( pair.ttl <= 0 ) {
            expired.push( ownerId );
            return;
        }
        if ( ! pair.armA ) {
            pair.armTimerA -= dt;
            pair.armA = pair.armTimerA <= 0;
        }
        if ( pair.ends === 2 && ! pair.armB ) {
            pair.armTimerB -= dt;
            pair.armB = pair.armTimerB <= 0;
        }
    } );
    for ( const ownerId of expired ) {
        const owner = state.players.get( ownerId );
        if ( owner && state.portals.get( ownerId )?.ends === 1 ) dropSecondCharge( owner );
        state.portals.delete( ownerId );
    }
}

export function settlePortals( ctx: RunContext, _run: PortalRun, dt: number ): void {
    stepPortals( ctx.state, dt );
}

export function hopPortal( ctx: RunContext, _run: PortalRun, victimId: string, from: HopOrigin, p: PlayerState ): void {
    const hop: PortalHopMessage = {
        fromX: from.x,
        fromY: from.y,
        fromZ: from.z,
        x: p.x,
        y: p.y,
        z: p.z,
        victimId,
    };
    ctx.broadcast( PORTAL_HOP_MESSAGE, hop );
}

export function resetPortals( ctx: RunContext, run: PortalRun ): void {
    ctx.state.portals.clear();
    run.taps.clear();
}
