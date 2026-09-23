import { FRACTURE_MAX_DEPTH, FRACTURE_MAX_WIDTH, FRACTURE_RATE_MAX, FRACTURE_RATE_START } from '../constants.js';
import { hash2, mulberry32 } from './rng.js';
import { type Block, type BlockBox, blockId, lerp } from './space.js';

const SALT_FRACTURE = 0x3f8a61d5 | 0;

export function fractureRate( intensity: number ): number {
    return lerp( FRACTURE_RATE_START, FRACTURE_RATE_MAX, intensity );
}

export function fractureFits( box: BlockBox ): boolean {
    return box.x1 - box.x0 <= FRACTURE_MAX_WIDTH && box.z1 - box.z0 <= FRACTURE_MAX_DEPTH;
}

export function placeBlock(
    seed: number,
    segIndex: number,
    k: number,
    intensity: number,
    box: BlockBox,
    breakable = true,
): Block {
    const id = blockId( segIndex, k );
    const roll = mulberry32( hash2( ( seed ^ SALT_FRACTURE ) | 0, id ) )();
    const fractured = breakable && fractureFits( box ) && roll < fractureRate( intensity );
    return { ...box, id, kind: fractured ? 'fractured' : 'sealed' };
}
