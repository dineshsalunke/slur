// M2 "hazard metal (coated)" — `docs/ART_MATERIALS.md`. A dielectric coat over an engineered form, against
// the deck's bare conductor: the two separate by FINISH, which survives lighting states where a value-only
// difference collapses.

export const SEALED_BLOCK_METALNESS = 0;
export const SEALED_BLOCK_ROUGHNESS = 0.52;
/** Near-black, pulled cooler than the deck. */
export const SEALED_BLOCK_COLOR = '#0d1117';

export const SEALED_BLOCK_SURFACE = {
    color: SEALED_BLOCK_COLOR,
    roughness: SEALED_BLOCK_ROUGHNESS,
    metalness: SEALED_BLOCK_METALNESS,
} as const;
