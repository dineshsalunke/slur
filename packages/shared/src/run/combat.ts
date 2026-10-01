import { powerIn, spendPower, startBoost, stepPickups } from '../combat/combat-step.js';
import {
    HeldPower,
    HIT_MESSAGE,
    type HitMessage,
    MINE_BURST_MESSAGE,
    SHIELD_POP_MESSAGE,
} from '../combat/constants.js';
import type { FireDir } from '../combat/fire-dir.js';
import { aimMine, evictOldest, type MineEvent, mineFizzle, stepMines } from '../combat/mine.js';
import type { Pickup } from '../combat/pickups.js';
import { absorbHit, dropShield, raiseShield, stepShield } from '../combat/shield.js';
import { targetShipsOf } from '../combat/target-lock.js';
import { Mine, type PlayerState, type RunState } from '../schema.js';
import { stunDurationForShip, tuningForShip } from '../ship-classes.js';
import type { Track } from '../sim/space.js';
import type { SimConfig } from '../sim-config.js';
import { isPortalPower, type PortalEnd, placePortal, stepPortals } from './portal-run.js';

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
): PortalEnd | null {
    const power = powerIn( p, slot );
    if ( isPortalPower( power ) ) return placePortal( ctx, p, ownerId, slot, dir );
    spendPower( p, slot );
    if ( power === HeldPower.mine ) layMine( ctx, id, p, ownerId, dir );
    else if ( power === HeldPower.boost ) startBoost( p, ctx.config );
    else if ( power === HeldPower.shield ) raiseShield( p, ctx.config.shieldS );
    return null;
}

export function shieldAbsorbs( v: PlayerState, at: HitMessage, broadcast: Broadcast ): boolean {
    if ( ! absorbHit( v ) ) return false;
    broadcast( SHIELD_POP_MESSAGE, at );
    return true;
}

export function stepCombat( ctx: CombatContext, dt: number, strike: ( dt: number ) => void = () => {} ): void {
    const { state, broken, config, broadcast } = ctx;
    state.players.forEach( ( p ) => {
        if ( p.dead ) dropShield( p );
        else stepShield( p, dt );
    } );
    const onMine = ( event: MineEvent ) => resolveMineEvent( state, event, broadcast, config );
    strike( dt );
    stepMines( state.mines, targetShipsOf( state.players.entries() ), dt, onMine, config );
    stepPortals( state, dt );
    stepPickups( state.players.values(), ctx.pickups, state.pickupTaken, ctx.pickupRespawn, dt, config );
    mirrorBreaks( state, broken );
}

function mirrorBreaks( state: RunState, broken: ReadonlySet< number > ): void {
    if ( broken.size === state.blockBroken.size ) return;
    for ( const id of broken ) {
        const key = String( id );
        if ( ! state.blockBroken.has( key ) ) state.blockBroken.set( key, true );
    }
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
