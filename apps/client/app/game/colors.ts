import type { COLOR_COUNT } from '@slur/shared';

export const PLAYER_BG = [
    'bg-player-0',
    'bg-player-1',
    'bg-player-2',
    'bg-player-3',
    'bg-player-4',
    'bg-player-5',
    'bg-player-6',
    'bg-player-7',
    'bg-player-8',
    'bg-player-9',
    'bg-player-10',
    'bg-player-11',
] as const;

const _paletteMatchesColorCount: typeof COLOR_COUNT = PLAYER_BG.length;

export const playerBg = ( id: number ): string => PLAYER_BG[ id ] ?? PLAYER_BG[ 0 ];
