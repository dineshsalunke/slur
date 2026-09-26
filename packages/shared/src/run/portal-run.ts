import { powerIn, spendPower } from '../combat/combat-step.js';
import {
    HeldPower,
    PORTAL_FIZZLE_MESSAGE,
    PORTAL_HOP_MESSAGE,
    POWER_SLOTS,
    type PortalFizzleMessage,
    type PortalHopMessage,
    SEEKER_MISS_MESSAGE,
} from '../combat/constants.js';
import type { FireDir } from '../combat/fire-dir.js';
import { type PortalSpot, placePortalEnd } from '../combat/portal.js';
import type { SeekerEvent } from '../combat/seeker.js';
import { type PlayerState, Portal, type RunState } from '../schema.js';
import { tuningForShip } from '../ship-classes.js';
import type { SimConfig } from '../sim-config.js';
import type { Broadcast, FireContext } from './combat.js';
import type { FireIntent } from './input-queue.js';

export type PortalEnd = 'a' | 'b';

export interface PortalTap {
    slot: number;
    dir: FireDir;
    seq: number;
    end: PortalEnd;
}

export interface HopOrigin {
    x: number;
    y: number;
    z: number;
}

export function isPortalPower( power: number ): boolean {
    return power === HeldPower.portal || power === HeldPower.portalB;
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
    if ( powerIn( p, slot ) === HeldPower.portalB && pair?.ends === 1 ) {
        setEnd( pair, 'b', spot, ctx.config );
        pair.ends = 2;
        pair.ttl = ctx.config.portalTtl;
        spendPower( p, slot );
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

export function portalHopped(
    state: RunState,
    victimId: string,
    from: HopOrigin,
    p: PlayerState,
    broadcast: Broadcast,
): void {
    const hop: PortalHopMessage = {
        fromX: from.x,
        fromY: from.y,
        fromZ: from.z,
        x: p.x,
        y: p.y,
        z: p.z,
        victimId,
    };
    broadcast( PORTAL_HOP_MESSAGE, hop );
    const lost: string[] = [];
    state.seekers.forEach( ( s, id ) => {
        if ( s.targetId !== victimId ) return;
        lost.push( id );
        const miss: SeekerEvent = { outcome: 'miss', x: s.x, y: s.y, z: s.z, targetId: victimId, ownerId: s.ownerId };
        broadcast( SEEKER_MISS_MESSAGE, miss );
    } );
    for ( const id of lost ) state.seekers.delete( id );
}
