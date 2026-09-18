// The frozen concept boards, as an addressable list.
//
// These are served in dev by `art-refs-plugin.ts` off `docs/art-direction/boards/` — nothing is
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
    /**
     * Absolute URL override for references that do NOT live in the boards dir. Without this the list can only
     * address `docs/art-direction/boards/`, and the one unoccluded sky reference lives in the client's own
     * `public/` — copying it in would fork the file the game actually renders.
     */
    url?: string;
}

/** Where the dev middleware mounts. Must match `artRefsPlugin`'s `route`. */
export const ART_REFS_ROUTE = '/art-refs';

export function boardUrl( id: string ): string {
    const board = REFERENCE_BOARDS.find( ( b ) => b.id === id );
    return board?.url ?? `${ ART_REFS_ROUTE }/${ id }`;
}

export const REFERENCE_BOARDS: readonly ReferenceBoard[] = [
    // AUTHORITY ENTRY 0 (art-pass INDEX §2). The boards were COMPOSED OVER this image — the sky in 12/13 IS
    // this file with rock painted on top — so for the SKY/far field it outranks them on tone as well as
    // structure; they are the same picture with information removed. Board 12 still outranks it for overall
    // scene colour, depth, composition and material: different subjects, both true.
    //
    // Judging an isolated ingredient against a COMPOSED board reads occlusion as intended faintness, which
    // cost a full review cycle: it produced "the nebula should be nearly invisible", which was backwards.
    // Served from the client's own public/ by Vite, not by the art-refs middleware, hence the `url` override.
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
    { id: '10_obstacle_blocks_final.png', name: '10 · Obstacle blocks', scaleTrust: 'mood-only' },
    { id: '11_pickups_weapons_final.png', name: '11 · Pickups & weapons', scaleTrust: 'mood-only' },
    // 12 is the TOP-PRECEDENCE reference for colour, depth, lighting, material and composition (art-pass
    // INDEX §2), and 13 is the cosmic-scale/cold-rim mood anchor. Both were on disk but missing from this
    // list, so the picker could not open the one board that outranks the rest.
    { id: '12_approved_scene_marigold_depth.png', name: '12 · Approved scene ★', scaleTrust: 'mood-only' },
    { id: '13_original_mood_anchor.png', name: '13 · Original mood anchor', scaleTrust: 'mood-only' },
] as const;

export const SCALE_TRUST_NOTE: Record< ScaleTrust, string > = {
    trusted: 'Scale-trustworthy — drawn against a correct 2.6u ship.',
    'mood-only': 'Judge mood/material/silhouette here, not dimensions.',
    undersized: '⚠ Drawn 4–10× UNDERSIZED. Never judge size against this board.',
};
