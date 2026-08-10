import type { COLOR_COUNT } from '@slur/shared';

// Team-colour palette (client visuals). colorId (uint8, synced) indexes this. Bright neon so the single
// global <Bloom> flares them. The hexes live client-side only — the wire syncs the INDEX, not the colour
// (schema.ts colorId), so palette tweaks never touch the wire contract.
//
// ORDER IS DELIBERATE. A joiner's default is `players.size % COLOR_COUNT` (run-room.ts), so consecutive
// indices go to consecutive joiners. Listing by hue would hand the first arrivals near-identical colours, so
// this alternates cool/warm to keep neighbouring slots as far apart as possible.
export const COLORS = [
    '#00e5ff', // cyan — brand
    '#ff9f1c', // marigold — brand
    '#00ff85', // spring green
    '#ff3b6b', // crimson
    '#b26bff', // violet
    '#ffe600', // yellow
    '#25a0ff', // azure
    '#ff6a00', // orange
    '#a6ff1a', // lime
    '#ff5cc8', // orchid
    '#6b7bff', // indigo
    '#ff3b3b', // red
] as const;

// Compile-time guard. The server validates a colorId against COLOR_COUNT, so a palette SHORTER than that
// would let a legal id fall off the end and quietly fall back to slot 0 — two players, one colour, no error
// anywhere. This line stops compiling the moment the two drift.
const _paletteMatchesColorCount: typeof COLOR_COUNT = COLORS.length;

export const colorHex = ( id: number ): string => COLORS[ id ] ?? COLORS[ 0 ];
