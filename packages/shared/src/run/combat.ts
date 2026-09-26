import { aimBolt, powerIn, spendPower, startBoost, stepBolts, stepPickups } from '../combat/combat-step.js';
import {
    HeldPower,
    HIT_MESSAGE,
    type HitMessage,
    MINE_BURST_MESSAGE,
    SEEKER_HIT_MESSAGE,
    SEEKER_MISS_MESSAGE,
    SHIELD_POP_MESSAGE,
} from '../combat/constants.js';
import type { FireDir } from '../combat/fire-dir.js';
import { aimMine, evictOldest, type MineEvent, mineFizzle, stepMines } from '../combat/mine.js';
import type { Pickup } from '../combat/pickups.js';
import { hitShipsOf } from '../combat/projectiles.js';
import { aimSeeker, lockTarget, type SeekerEvent, seekerShipsOf, stepSeekers } from '../combat/seeker.js';
import { absorbHit, dropShield, raiseShield, stepShield } from '../combat/shield.js';
import { Mine, type PlayerState, Projectile, type RunState, Seeker } from '../schema.js';
import { stunDurationForShip, tuningForShip } from '../ship-classes.js';
import type { Track } from '../sim/space.js';
import type { SimConfig } from '../sim-config.js';

export type Broadcast = ( type: string, message: unknown ) => void;

export interface FireContext {
    state: RunState;
    track: Track;
    broken: ReadonlySet< number >;
    config: SimConfig;
    broadcast: Broadcast;
}

export interface CombatContext extends FireContext {
    broken: Set< number >;
    pickups: readonly Pickup[];
    pickupRespawn: Map< string, number >;
}

export function firePower(
    ctx: FireContext,
    id: string,
    p: PlayerState,
    ownerId: string,
    slot: number,
    dir: FireDir = 1,
): void {
    const power = powerIn( p, slot );
    spendPower( p, slot );
    if ( power === HeldPower.seeker ) fireSeeker( ctx, id, p, ownerId, dir );
    else if ( power === HeldPower.mine ) layMine( ctx, id, p, ownerId, dir );
    else if ( power === HeldPower.bolt ) fireBolt( ctx, id, p, ownerId, dir );
    else if ( power === HeldPower.boost ) startBoost( p, ctx.config );
    else if ( power === HeldPower.shield ) raiseShield( p, ctx.config.shieldS );
}

export function shieldAbsorbs( v: PlayerState, at: HitMessage, broadcast: Broadcast ): boolean {
    if ( ! absorbHit( v ) ) return false;
    broadcast( SHIELD_POP_MESSAGE, at );
    return true;
}

export function stepCombat( ctx: CombatContext, dt: number ): void {
    const { state, track, broken, config, broadcast } = ctx;
    state.players.forEach( ( p ) => {
        if ( p.dead ) dropShield( p );
        else stepShield( p, dt );
    } );
    const onMine = ( event: MineEvent ) => resolveMineEvent( state, event, broadcast, config );
    stepBolts(
        state.projectiles,
        hitShipsOf( state.players.entries() ),
        track,
        broken,
        dt,
        ( strike ) => {
            const v = state.players.get( strike.victimId );
            if ( v && shieldAbsorbs( v, strike, broadcast ) ) return;
            if ( v ) v.stunTimer = stunDurationForShip( v.shipId, config );
            broadcast( HIT_MESSAGE, strike );
        },
        config,
        state.mines,
        onMine,
    );
    const seekerShips = seekerShipsOf( state.players.entries() );
    stepSeekers(
        state.seekers,
        seekerShips,
        track,
        broken,
        dt,
        ( event ) => resolveSeekerEvent( state, event, broadcast, config ),
        config,
    );
    stepMines( state.mines, seekerShips, dt, onMine, config );
    stepPickups( state.players.values(), ctx.pickups, state.pickupTaken, ctx.pickupRespawn, dt, config );
}

function fireBolt( ctx: FireContext, id: string, p: PlayerState, ownerId: string, dir: FireDir ): void {
    const bolt = new Projectile();
    aimBolt( bolt, p, ownerId, ctx.config, dir );
    ctx.state.projectiles.set( id, bolt );
}

function fireSeeker( ctx: FireContext, id: string, p: PlayerState, ownerId: string, dir: FireDir ): void {
    const ships = seekerShipsOf( ctx.state.players.entries() );
    const targetId = lockTarget( p, ownerId, ships, ctx.track, ctx.broken, ctx.config, dir );
    const seeker = new Seeker();
    aimSeeker( seeker, p, ownerId, targetId, ctx.config, dir );
    ctx.state.seekers.set( id, seeker );
}

function layMine( ctx: FireContext, id: string, p: PlayerState, ownerId: string, dir: FireDir ): void {
    const mine = new Mine();
    const hull = tuningForShip( p.shipId );
    if ( ! aimMine( mine, p, hull, ownerId, ctx.track, ctx.broken, ctx.config, dir ) ) {
        ctx.broadcast( MINE_BURST_MESSAGE, mineFizzle( p, hull.halfL, ownerId, ctx.config, dir ) );
        return;
    }
    const onEvict = ( e: MineEvent ) => resolveMineEvent( ctx.state, e, ctx.broadcast, ctx.config );
    evictOldest( ctx.state.mines, ownerId, onEvict, ctx.config );
    ctx.state.mines.set( id, mine );
}

export function resolveMineEvent( state: RunState, event: MineEvent, broadcast: Broadcast, config: SimConfig ): void {
    const { x, y, z, victimId } = event;
    const v = event.outcome === 'trigger' ? state.players.get( victimId ) : undefined;
    if ( v && ! shieldAbsorbs( v, { x, y, z, victimId }, broadcast ) ) {
        v.stunTimer = stunDurationForShip( v.shipId, config, config.mineStunS );
        v.vz *= config.mineSpeedCut;
        broadcast( HIT_MESSAGE, { x, y, z, victimId } );
    }
    broadcast( MINE_BURST_MESSAGE, event );
}

export function resolveSeekerEvent(
    state: RunState,
    event: SeekerEvent,
    broadcast: Broadcast,
    config: SimConfig,
): void {
    const { x, y, z } = event;
    if ( event.outcome === 'miss' ) {
        broadcast( SEEKER_MISS_MESSAGE, event );
        return;
    }
    if ( event.outcome === 'blocked' ) {
        broadcast( HIT_MESSAGE, { x, y, z, victimId: '' } );
        return;
    }
    const v = state.players.get( event.targetId );
    if ( v && shieldAbsorbs( v, { x, y, z, victimId: event.targetId }, broadcast ) ) return;
    if ( v ) v.stunTimer = stunDurationForShip( v.shipId, config, config.seekerStunS );
    broadcast( HIT_MESSAGE, { x, y, z, victimId: event.targetId } );
    broadcast( SEEKER_HIT_MESSAGE, event );
}
