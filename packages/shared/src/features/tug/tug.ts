import { lockTarget, type TargetShip } from '../../combat/target-lock.js';
import { stunDurationForShip } from '../../ship-classes.js';
import { segIndexForZ, type Track } from '../../sim/space.js';
import type { SimShip } from '../../sim/types.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../../sim-config.js';

export interface BlockAnchor {
    x: number;
    z: number;
    id: number;
}

export type TugTarget = { kind: 'rival'; id: string } | ( { kind: 'block' } & BlockAnchor ) | null;

export type TugOutcome = 'throw' | 'latch' | 'anchor' | 'miss' | 'none';

export interface TugEvent {
    outcome: TugOutcome;
    ownerId: string;
    targetId: string;
    dir: number;
    x: number;
    y: number;
    z: number;
    seconds: number;
}

export interface TugVictim extends SimShip {
    shipId: string;
}

export function blockAnchor(
    shooter: { x: number; z: number },
    track: Track,
    broken: ReadonlySet< number >,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): BlockAnchor | null {
    const near = shooter.z + cfg.tugBlockMin;
    const reach = shooter.z + cfg.tugBlockMax;
    let best: BlockAnchor | null = null;
    for ( let i = segIndexForZ( near ); i <= segIndexForZ( reach ); i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( broken.has( b.id ) || b.z0 < near || b.z0 > reach ) continue;
            if ( best !== null && ( b.z0 > best.z || ( b.z0 === best.z && b.id > best.id ) ) ) continue;
            best = { x: Math.min( Math.max( shooter.x, b.x0 ), b.x1 ), z: b.z0, id: b.id };
        }
    }
    return best;
}

export function tugTarget(
    shooter: { x: number; z: number },
    ownerId: string,
    ships: readonly TargetShip[],
    track: Track,
    broken: ReadonlySet< number >,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    dir = 1,
): TugTarget {
    const id = lockTarget( shooter, ownerId, ships, track, broken, cfg.tugRange, cfg.seekerHalf, dir );
    if ( id !== '' ) return { kind: 'rival', id };
    if ( dir < 0 ) return null;
    const anchor = blockAnchor( shooter, track, broken, cfg );
    return anchor === null ? null : { kind: 'block', ...anchor };
}

export function throwSeconds( gap: number, range: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    const k = range > 0 ? Math.min( 1, Math.max( 0, gap / range ) ) : 1;
    return cfg.tugThrowMinS + ( cfg.tugThrowMaxS - cfg.tugThrowMinS ) * k;
}

export function catapult( firer: SimShip, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    firer.vz += cfg.tugKick;
    firer.tugTimer = cfg.tugS;
    firer.tugAnchorZ = 0;
}

export function reel( firer: SimShip, anchorZ: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    catapult( firer, cfg );
    firer.tugAnchorZ = anchorZ;
}

export function slowTarget( v: TugVictim, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    v.slowTimer = stunDurationForShip( v.shipId, cfg, cfg.tugSlowS );
    v.vz *= cfg.tugSpeedCut;
}

export function towTarget( v: TugVictim, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    v.vz += cfg.towKick;
    v.towTimer = stunDurationForShip( v.shipId, cfg, cfg.towS );
}
