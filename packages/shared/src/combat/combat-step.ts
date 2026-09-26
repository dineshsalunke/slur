import type { Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { BOLT_SPAWN_AHEAD, HeldPower, POWER_SLOTS } from './constants.js';
import { entryZ } from './fire-dir.js';
import { type MineEvent, type MineState, mineEvent } from './mine.js';
import { grabPickup, type Pickup, pickupPower } from './pickups.js';
import { type HitShip, type ProjectileState, resolveBolt, stepProjectiles } from './projectiles.js';

export interface Gunner {
    x: number;
    y: number;
    z: number;
    slots: number[];
    stunTimer: number;
    dead: boolean;
    spectating: boolean;
}

export interface BoltStrike {
    x: number;
    y: number;
    z: number;
    victimId: string;
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

export function aimBolt(
    bolt: ProjectileState,
    g: Gunner,
    ownerId: string,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    dir = 1,
): void {
    bolt.x = g.x;
    bolt.y = g.y;
    bolt.z = g.z + dir * BOLT_SPAWN_AHEAD;
    bolt.ownerId = ownerId;
    bolt.ttl = cfg.boltTtl;
    bolt.dir = dir;
}

export function stepBolts(
    bolts: Map< string, ProjectileState >,
    ships: readonly HitShip[],
    track: Track,
    broken: Set< number >,
    dt: number,
    onStrike: ( strike: BoltStrike ) => void,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    mines: Map< string, MineState > = new Map(),
    onMine: ( event: MineEvent ) => void = () => {},
): void {
    stepProjectiles( bolts.values(), dt, cfg );
    const sweep = cfg.boltSpeed * dt;
    const spent: string[] = [];
    bolts.forEach( ( bolt, id ) => {
        const out = resolveBolt( bolt, ships, track, broken, sweep, cfg, mines );
        for ( const victimId of out.victims ) onStrike( { x: bolt.x, y: bolt.y, z: bolt.z, victimId } );
        const mine = out.mine === null ? undefined : mines.get( out.mine );
        if ( out.mine !== null && mine ) {
            mines.delete( out.mine );
            onMine( mineEvent( mine, 'cleared' ) );
        }
        if ( out.block?.kind === 'fractured' ) broken.add( out.block.id );
        if ( out.block ) {
            onStrike( { x: bolt.x, y: bolt.y, z: entryZ( out.block.z0, out.block.z1, bolt.dir ), victimId: '' } );
        }
        if ( out.spent ) spent.push( id );
    } );
    for ( const id of spent ) bolts.delete( id );
}

export function stepPickups(
    racers: Iterable< Gunner >,
    pickups: readonly Pickup[],
    taken: Map< string, boolean >,
    respawn: Map< string, number >,
    dt: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    for ( const r of racers ) {
        if ( r.spectating || r.dead || firstEmptySlot( r ) < 0 ) continue;
        const pk = pickups.find( ( p ) => ! taken.get( p.id ) && grabPickup( r, p ) );
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
