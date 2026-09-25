export type FireDir = 1 | -1;

export function fireDir( raw: unknown ): FireDir {
    return raw === -1 ? -1 : 1;
}

export function sweptZ( z: number, half: number, sweep: number, dir: number ): [ number, number ] {
    return dir < 0 ? [ z - half, z + half + sweep ] : [ z - half - sweep, z + half ];
}

export function entryZ( z0: number, z1: number, dir: number ): number {
    return dir < 0 ? z1 : z0;
}
