// Team-colour palette (client visuals). colorId (uint8, synced) indexes this; COLORS.length === COLOR_COUNT (8).
// Bright neon so the single global <Bloom> flares them. The hexes live client-side only — the wire syncs the
// index, not the colour (schema.ts colorId), so palette tweaks never touch the wire contract.
export const COLORS = [
    '#00e5ff',
    '#ff2bd6',
    '#ffe600',
    '#00ff85',
    '#ff6a00',
    '#b26bff',
    '#ff3b3b',
    '#25a0ff',
] as const;

export const colorHex = ( id: number ): string => COLORS[ id ] ?? COLORS[ 0 ];
