import { stunDurationForShip } from '../ship-classes.js';
import { segIndexForZ, type Track } from '../sim/space.js';
import type { SimShip } from '../sim/types.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { lockTarget, type SeekerShip } from './seeker.js';

export type TugTarget = { kind: 'rival'; id: string } | { kind: 'block'; x: number; z: number } | null;

export type TugOutcome = 'latch' | 'anchor' | 'none';

export interface TugEvent {
    outcome: TugOutcome;
    ownerId: string;
    targetId: string;
    dir: number;
    x: number;
    y: number;
    z: number;
}

export interface TugVictim extends SimShip {
    shipId: string;
}

export function blockAnchor(
    shooter: { x: number; z: number },
    track: Track,
    broken: ReadonlySet< number >,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): { x: number; z: number } | null {
    const reach = shooter.z + cfg.tugRange;
    let best: { x: number; z: number; id: number } | null = null;
    for ( let i = segIndexForZ( shooter.z ); i <= segIndexForZ( reach ); i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( broken.has( b.id ) || b.z0 <= shooter.z || b.z0 > reach ) continue;
            if ( best !== null && ( b.z0 > best.z || ( b.z0 === best.z && b.id > best.id ) ) ) continue;
            best = { x: Math.min( Math.max( shooter.x, b.x0 ), b.x1 ), z: b.z0, id: b.id };
        }
    }
    return best === null ? null : { x: best.x, z: best.z };
}

export function tugTarget(
    shooter: { x: number; z: number },
    ownerId: string,
    ships: readonly SeekerShip[],
    track: Track,
    broken: ReadonlySet< number >,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    dir = 1,
): TugTarget {
    const id = lockTarget( shooter, ownerId, ships, track, broken, { ...cfg, seekerLockRange: cfg.tugRange }, dir );
    if ( id !== '' ) return { kind: 'rival', id };
    if ( dir < 0 ) return null;
    const anchor = blockAnchor( shooter, track, broken, cfg );
    return anchor === null ? null : { kind: 'block', ...anchor };
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
