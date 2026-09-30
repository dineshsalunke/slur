import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { entryZ, sweptZ } from './fire-dir.js';

export interface MineState {
    x: number;
    y: number;
    z: number;
    ownerId: string;
    armed: boolean;
    ttl: number;
}

export type MineOutcome = 'trigger' | 'cleared' | 'evicted' | 'expired' | 'fizzle';

export interface MineEvent {
    outcome: MineOutcome;
    x: number;
    y: number;
    z: number;
    victimId: string;
    ownerId: string;
}

export function mineEvent( mine: MineState, outcome: MineOutcome, victimId = '' ): MineEvent {
    return { outcome, x: mine.x, y: mine.y, z: mine.z, victimId, ownerId: mine.ownerId };
}

export function mineShotFront(
    mine: MineState,
    shot: { x: number; y: number; z: number; dir: number },
    sweep: number,
    shotHalf: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): number | null {
    const h = cfg.mineHalf;
    const [ zLo, zHi ] = sweptZ( shot.z, shotHalf, sweep, shot.dir );
    const hit =
        shot.x + shotHalf > mine.x - h &&
        shot.x - shotHalf < mine.x + h &&
        shot.y + shotHalf > mine.y &&
        shot.y - shotHalf < mine.y + cfg.mineHeight &&
        zHi > mine.z - h &&
        zLo < mine.z + h;
    return hit ? entryZ( mine.z - h, mine.z + h, shot.dir ) : null;
}
