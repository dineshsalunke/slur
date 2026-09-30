import { tuningForShip } from '../ship-classes.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { HeldPower, POWER_SLOTS } from './constants.js';
import { grabPickup, type Pickup, pickupPower } from './pickups.js';

export interface Gunner {
    x: number;
    y: number;
    z: number;
    slots: number[];
    stunTimer: number;
    dead: boolean;
    spectating: boolean;
}

export interface Grabber extends Gunner {
    shipId: string;
}

export function emptySlots(): number[] {
    return Array.from( { length: POWER_SLOTS }, () => HeldPower.none );
}

export function isSlot( slot: unknown ): slot is number {
    return Number.isInteger( slot ) && ( slot as number ) >= 0 && ( slot as number ) < POWER_SLOTS;
}

export function powerIn( g: Gunner, slot: number ): number {
    return isSlot( slot ) ? ( g.slots[ slot ] ?? HeldPower.none ) : HeldPower.none;
}

export function canFire( g: Gunner, slot: number ): boolean {
    return ! g.spectating && ! g.dead && g.stunTimer <= 0 && powerIn( g, slot ) !== HeldPower.none;
}

export function spendPower( g: Gunner, slot: number ): number {
    const power = powerIn( g, slot );
    if ( power !== HeldPower.none ) g.slots[ slot ] = HeldPower.none;
    return power;
}

export function dropPower( g: Gunner, slot: number ): boolean {
    if ( g.spectating ) return false;
    return spendPower( g, slot ) !== HeldPower.none;
}

export function firstEmptySlot( g: Gunner ): number {
    for ( let i = 0; i < POWER_SLOTS; i++ ) if ( powerIn( g, i ) === HeldPower.none ) return i;
    return -1;
}

export function grantPower( g: Gunner, power: number ): boolean {
    const slot = firstEmptySlot( g );
    if ( slot < 0 ) return false;
    g.slots[ slot ] = power;
    return true;
}

export function startBoost( ship: { boostTimer: number }, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    ship.boostTimer = cfg.boostS;
}

export function stepPickups(
    racers: Iterable< Grabber >,
    pickups: readonly Pickup[],
    taken: Map< string, boolean >,
    respawn: Map< string, number >,
    dt: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    for ( const r of racers ) {
        if ( r.spectating || r.dead || firstEmptySlot( r ) < 0 ) continue;
        const { halfW, halfL } = tuningForShip( r.shipId );
        const hull = { x: r.x, z: r.z, halfW, halfL };
        const pk = pickups.find( ( p ) => ! taken.get( p.id ) && grabPickup( hull, p, cfg ) );
        if ( ! pk ) continue;
        grantPower( r, pickupPower( pk.id, cfg ) );
        taken.set( pk.id, true );
        respawn.set( pk.id, cfg.pickupRespawnS );
    }
    for ( const [ id, timer ] of respawn ) {
        const next = timer - dt;
        if ( next > 0 ) {
            respawn.set( id, next );
            continue;
        }
        taken.set( id, false );
        respawn.delete( id );
    }
}
