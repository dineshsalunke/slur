import type { Track } from '../sim/space.js';
import { floorUnder } from '../sim/step.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { entryZ, sweptZ } from './fire-dir.js';
import type { SeekerShip } from './seeker.js';

export interface MineState {
    x: number;
    y: number;
    z: number;
    ownerId: string;
    armed: boolean;
    ttl: number;
}

export interface MineLayer {
    x: number;
    y: number;
    z: number;
}

export interface MineHull {
    halfL: number;
    stepTol: number;
}

export type MineOutcome = 'trigger' | 'cleared' | 'evicted' | 'expired';

export interface MineEvent {
    outcome: MineOutcome;
    x: number;
    y: number;
    z: number;
    victimId: string;
    ownerId: string;
}

export function aimMine(
    mine: MineState,
    ship: MineLayer,
    hull: MineHull,
    ownerId: string,
    track: Track,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    dir = 1,
): boolean {
    const z = dir < 0 ? ship.z : ship.z + hull.halfL + cfg.mineDropAhead;
    const y = floorUnder( track.segmentAtZ( z ), ship.x, z, ship.y, hull.stepTol );
    if ( y === null ) return false;
    mine.x = ship.x;
    mine.y = y;
    mine.z = z;
    mine.ownerId = ownerId;
    mine.armed = false;
    mine.ttl = cfg.mineTtl;
    return true;
}

export function mineEvent( mine: MineState, outcome: MineOutcome, victimId = '' ): MineEvent {
    return { outcome, x: mine.x, y: mine.y, z: mine.z, victimId, ownerId: mine.ownerId };
}

function oldestOf( mines: Map< string, MineState >, ownerId: string ): [ string, number ] {
    let oldest = '';
    let count = 0;
    let ttl = Number.POSITIVE_INFINITY;
    for ( const [ id, m ] of mines ) {
        if ( m.ownerId !== ownerId ) continue;
        count++;
        if ( m.ttl < ttl ) {
            ttl = m.ttl;
            oldest = id;
        }
    }
    return [ oldest, count ];
}

export function evictOldest(
    mines: Map< string, MineState >,
    ownerId: string,
    onEvent: ( event: MineEvent ) => void,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    for (;;) {
        const [ oldest, count ] = oldestOf( mines, ownerId );
        const mine = mines.get( oldest );
        if ( count < cfg.mineMaxPerOwner || ! mine ) return;
        mines.delete( oldest );
        onEvent( mineEvent( mine, 'evicted' ) );
    }
}

export function mineTriggers( mine: MineState, s: SeekerShip, cfg: SimConfig = DEFAULT_SIM_CONFIG ): boolean {
    if ( ! mine.armed || s.id === mine.ownerId || s.dead || s.spectating || s.finished ) return false;
    const r = cfg.mineTriggerR;
    return (
        s.y - mine.y < cfg.mineTriggerH &&
        Math.abs( s.x - mine.x ) < r + s.halfW &&
        Math.abs( s.z - mine.z ) < r + s.halfL
    );
}

function victimOf( mine: MineState, ships: readonly SeekerShip[], cfg: SimConfig ): string {
    let victim = '';
    for ( const s of ships ) if ( mineTriggers( mine, s, cfg ) && ( victim === '' || s.id < victim ) ) victim = s.id;
    return victim;
}

export function stepMines(
    mines: Map< string, MineState >,
    ships: readonly SeekerShip[],
    dt: number,
    onEvent: ( event: MineEvent ) => void,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    const spent: string[] = [];
    mines.forEach( ( mine, id ) => {
        mine.ttl -= dt;
        if ( ! mine.armed && mine.ttl <= cfg.mineTtl - cfg.mineArmS ) mine.armed = true;
        const victim = victimOf( mine, ships, cfg );
        if ( victim !== '' ) {
            spent.push( id );
            onEvent( mineEvent( mine, 'trigger', victim ) );
        } else if ( mine.ttl <= 0 ) {
            spent.push( id );
            onEvent( mineEvent( mine, 'expired' ) );
        }
    } );
    for ( const id of spent ) mines.delete( id );
}

export function mineBoltFront(
    mine: MineState,
    bolt: { x: number; y: number; z: number; dir: number },
    sweep: number,
    boltHalf: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): number | null {
    const h = cfg.mineHalf;
    const [ zLo, zHi ] = sweptZ( bolt.z, boltHalf, sweep, bolt.dir );
    const hit =
        bolt.x + boltHalf > mine.x - h &&
        bolt.x - boltHalf < mine.x + h &&
        bolt.y + boltHalf > mine.y &&
        bolt.y - boltHalf < mine.y + cfg.mineHeight &&
        zHi > mine.z - h &&
        zLo < mine.z + h;
    return hit ? entryZ( mine.z - h, mine.z + h, bolt.dir ) : null;
}
