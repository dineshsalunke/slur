import { powerIn, spendPower, stepPickups } from '../combat/combat-step.js';
import { HeldPower, type HitMessage, SHIELD_POP_MESSAGE } from '../combat/constants.js';
import type { FireDir } from '../combat/fire-dir.js';
import type { Pickup } from '../combat/pickups.js';
import { absorbHit, dropShield, raiseShield, stepShield } from '../combat/shield.js';
import type { PlayerState, RunState } from '../schema.js';
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

export interface CombatPhases {
    readonly strike: ( dt: number ) => void;
    readonly settle: ( dt: number ) => void;
}

export function firePower(
    ctx: FireContext,
    p: PlayerState,
    ownerId: string,
    slot: number,
    dir: FireDir = 1,
): PortalEnd | null {
    const power = powerIn( p, slot );
    if ( isPortalPower( power ) ) return placePortal( ctx, p, ownerId, slot, dir );
    spendPower( p, slot );
    if ( power === HeldPower.shield ) raiseShield( p, ctx.config.shieldS );
    return null;
}

export function shieldAbsorbs( v: PlayerState, at: HitMessage, broadcast: Broadcast ): boolean {
    if ( ! absorbHit( v ) ) return false;
    broadcast( SHIELD_POP_MESSAGE, at );
    return true;
}

export function stepCombat( ctx: CombatContext, dt: number, phases: CombatPhases ): void {
    const { state, broken, config } = ctx;
    state.players.forEach( ( p ) => {
        if ( p.dead ) dropShield( p );
        else stepShield( p, dt );
    } );
    phases.strike( dt );
    phases.settle( dt );
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
