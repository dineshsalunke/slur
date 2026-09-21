import type { COLOR_COUNT } from '@slur/shared';

export const COLORS = [
    '#00e5ff',
    '#ff9f1c',
    '#00ff85',
    '#ff3b6b',
    '#b26bff',
    '#ffe600',
    '#25a0ff',
    '#ff6a00',
    '#a6ff1a',
    '#ff5cc8',
    '#6b7bff',
    '#ff3b3b',
] as const;

const _paletteMatchesColorCount: typeof COLOR_COUNT = COLORS.length;

export const colorHex = ( id: number ): string => COLORS[ id ] ?? COLORS[ 0 ];
