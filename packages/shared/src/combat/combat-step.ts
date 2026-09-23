import type { Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { BOLT_SPAWN_AHEAD, HeldPower } from './constants.js';
import { grabPickup, type Pickup } from './pickups.js';
import { type HitShip, type ProjectileState, resolveBolt, stepProjectiles } from './projectiles.js';

export interface Gunner {
    x: number;
    y: number;
    z: number;
    heldPower: number;
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

export function canFire( g: Gunner ): boolean {
    return ! g.spectating && ! g.dead && g.stunTimer <= 0 && g.heldPower !== HeldPower.none;
}

export function aimBolt(
    bolt: ProjectileState,
    g: Gunner,
    ownerId: string,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    bolt.x = g.x;
    bolt.y = g.y;
    bolt.z = g.z + BOLT_SPAWN_AHEAD;
    bolt.ownerId = ownerId;
    bolt.ttl = cfg.boltTtl;
}

export function stepBolts(
    bolts: Map< string, ProjectileState >,
    ships: readonly HitShip[],
    track: Track,
    broken: Set< number >,
    dt: number,
    onStrike: ( strike: BoltStrike ) => void,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    stepProjectiles( bolts.values(), dt, cfg );
    const sweep = cfg.boltSpeed * dt;
    const spent: string[] = [];
    bolts.forEach( ( bolt, id ) => {
        const out = resolveBolt( bolt, ships, track, broken, sweep, cfg );
        for ( const victimId of out.victims ) onStrike( { x: bolt.x, y: bolt.y, z: bolt.z, victimId } );
        if ( out.block?.kind === 'fractured' ) broken.add( out.block.id );
        if ( out.block ) onStrike( { x: bolt.x, y: bolt.y, z: out.block.z0, victimId: '' } );
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
        if ( r.spectating || r.dead || r.heldPower !== HeldPower.none ) continue;
        const pk = pickups.find( ( p ) => ! taken.get( p.id ) && grabPickup( r, p ) );
        if ( ! pk ) continue;
        r.heldPower = HeldPower.bolt;
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
