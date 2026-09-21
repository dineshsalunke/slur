export type ScaleTrust = 'trusted' | 'mood-only' | 'undersized';

export interface ReferenceBoard {
    id: string;
    name: string;
    scaleTrust: ScaleTrust;
    url?: string;
}

export const ART_REFS_ROUTE = '/art-refs';

export function boardUrl( id: string ): string {
    const board = REFERENCE_BOARDS.find( ( b ) => b.id === id );
    return board?.url ?? `${ ART_REFS_ROUTE }/${ id }`;
}

export const REFERENCE_BOARDS: readonly ReferenceBoard[] = [
    {
        id: 'nebula-backdrop.jpg',
        name: '★ Nebula backdrop (boards’ sky)',
        scaleTrust: 'mood-only',
        url: '/textures/nebula-backdrop.jpg',
    },
    { id: '00_original_slur_gameplay_concept.png', name: '00 · Original concept', scaleTrust: 'mood-only' },
    { id: '01_color_lighting_moodboard.png', name: '01 · Colour & lighting', scaleTrust: 'mood-only' },
    { id: '02_environment_intensity_A_B_C.png', name: '02 · Env intensity A/B/C', scaleTrust: 'mood-only' },
    { id: '03_monoliths_final.png', name: '03 · Monoliths', scaleTrust: 'trusted' },
    { id: '04_asteroids_final.png', name: '04 · Asteroids', scaleTrust: 'trusted' },
    { id: '05_planets_moons_final.png', name: '05 · Planets & moons', scaleTrust: 'mood-only' },
    { id: '06_sector_concepts_final.png', name: '06 · Sector concepts', scaleTrust: 'mood-only' },
    { id: '07_track_visual_language_final.png', name: '07 · Track language', scaleTrust: 'undersized' },
    { id: '08_gap_variations_reference.png', name: '08 · Gap variations', scaleTrust: 'mood-only' },
    { id: '09_small_gap_readability_final.png', name: '09 · Small-gap readability', scaleTrust: 'undersized' },
    { id: '10_obstacle_blocks_final.png', name: '10 · Obstacle blocks (SUPERSEDED)', scaleTrust: 'mood-only' },
    {
        id: '28_non_destructible_blocks_FINAL_DRAFT.png',
        name: '28 · Sealed blocks ★ (current)',
        scaleTrust: 'mood-only',
        url: '/art-refs-blocks/28_non_destructible_blocks_FINAL_DRAFT.png',
    },
    { id: '11_pickups_weapons_final.png', name: '11 · Pickups & weapons', scaleTrust: 'mood-only' },
    { id: '12_approved_scene_marigold_depth.png', name: '12 · Approved scene ★', scaleTrust: 'mood-only' },
    { id: '13_original_mood_anchor.png', name: '13 · Original mood anchor', scaleTrust: 'mood-only' },
] as const;

export const SCALE_TRUST_NOTE: Record< ScaleTrust, string > = {
    trusted: 'Scale-trustworthy — drawn against a correct 2.6u ship.',
    'mood-only': 'Judge mood/material/silhouette here, not dimensions.',
    undersized: '⚠ Drawn 4–10× UNDERSIZED. Never judge size against this board.',
};
