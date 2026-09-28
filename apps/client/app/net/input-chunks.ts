import { MAX_QUEUED_INPUTS, type PlayerInput } from '@slur/shared';

export const INPUT_CHUNK = 20;

export function inputChunks( inputs: readonly PlayerInput[] ): PlayerInput[][] {
    const kept = inputs.slice( -MAX_QUEUED_INPUTS );
    const chunks: PlayerInput[][] = [];
    for ( let i = 0; i < kept.length; i += INPUT_CHUNK ) chunks.push( kept.slice( i, i + INPUT_CHUNK ) );
    return chunks;
}
