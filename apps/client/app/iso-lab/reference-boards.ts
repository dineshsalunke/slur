// The frozen `art-handoff-v1` concept boards, as an addressable list.
//
// These are served in dev by `art-refs-plugin.ts` off `docs/references/art-handoff-v1/boards/` — nothing is
// copied, so this list is a pointer, not a duplicate. Filenames are the contract between the two.
//
// SCALE WARNING carried in the data, not in a README nobody opens: `docs/ART_SCALE_REFERENCE.md` overrides
// every dimension printed on a board. Only 03 and 04 were drawn against a correct ship reference; 07 and 09
// are 4–10× undersized. `scaleTrust` surfaces that in the picker, so a reviewer cannot eyeball a render
// against a board that is lying about size without being told.

export type ScaleTrust = 'trusted' | 'mood-only' | 'undersized';

export interface ReferenceBoard {
    /** Filename inside the boards dir — also the id. */
    id: string;
    /** Short label for the picker. */
    name: string;
    /** Is this board safe to judge SIZE against? */
    scaleTrust: ScaleTrust;
}

/** Where the dev middleware mounts. Must match `artRefsPlugin`'s `route`. */
export const ART_REFS_ROUTE = '/art-refs';

export function boardUrl( id: string ): string {
    return `${ ART_REFS_ROUTE }/${ id }`;
}

export const REFERENCE_BOARDS: readonly ReferenceBoard[] = [
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
    { id: '10_obstacle_blocks_final.png', name: '10 · Obstacle blocks', scaleTrust: 'mood-only' },
    { id: '11_pickups_weapons_final.png', name: '11 · Pickups & weapons', scaleTrust: 'mood-only' },
] as const;

export const SCALE_TRUST_NOTE: Record< ScaleTrust, string > = {
    trusted: 'Scale-trustworthy — drawn against a correct 2.6u ship.',
    'mood-only': 'Judge mood/material/silhouette here, not dimensions.',
    undersized: '⚠ Drawn 4–10× UNDERSIZED. Never judge size against this board.',
};
