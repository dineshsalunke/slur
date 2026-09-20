// The ONE definition of what each track surface is made of — `meshStandardMaterial` props spread onto the
// JSX element, so the game and `/art-gallery` cannot drift from what ships.
//
// NO `toneMapped: false` HERE, deliberately. Opting out made the art direction's own test — "does the rail
// read marigold in the final tone-mapped frame" — unrunnable. These intensities are authored to survive
// ACES, not to bypass it.

import { edgeFalloffRamp, trackSurfaceTexture } from './track-texture';

/**
 * Base roughness of the track's dark metal. The block's per-fragment roughness is perturbed RELATIVELY
 * around this, so the two dark-metal languages cannot fork when it moves — import it, never copy it.
 */
export const FLOOR_ROUGHNESS = 0.42;

export const FLOOR_METALNESS = 1.0;

/** The ribbon deck. A function, not a frozen object: `trackSurfaceTexture()` needs `document` and must not
 *  run at import. `color` is white because base colour MULTIPLIES the map. */
export const FLOOR_ENV_MAP_INTENSITY = 1;

/** The deck's only brightness control, measured: 0 blacks it out, while envMap, ambient and the star each
 *  move nothing on it. Colour is still the cool grey-white, unresolved against a marigold-primary palette. */
export const FLOOR_EMISSIVE = '#c8d0d8';
export const FLOOR_EMISSIVE_INTENSITY = 0.05;

export function floorSurface() {
    return {
        color: '#ffffff',
        map: trackSurfaceTexture(),
        roughness: FLOOR_ROUGHNESS,
        metalness: FLOOR_METALNESS,
        emissive: FLOOR_EMISSIVE,
        emissiveIntensity: FLOOR_EMISSIVE_INTENSITY,
    };
}

/** Lethal blocks — touch and you derezz, so danger must read instantly. Still red although the palette
 *  excludes red: retoning is the block-design task's call, and `TrackBlocks` is its own layer. */
export const LETHAL_SURFACE = {
    emissive: '#ff2740',
    emissiveIntensity: 2.2,
    color: '#1a0206',
} as const;

/**
 * Drag ("slow") blocks — amber and translucent so they read PASSABLE rather than fatal. Dimmer than
 * lethal so red stays the louder warning. Opacity is pulsed at runtime between the two bounds below.
 */
export const DRAG_SURFACE = {
    emissive: '#ffa51f',
    emissiveIntensity: 1.6,
    color: '#2a1600',
    transparent: true,
    depthWrite: false,
} as const;

// Gameplay-tier marigold reference — the boundary strip IS it, every other marigold is a fraction of it.
// Authored pre-bloom: dialling it down to cancel the global <Bloom> rescales every marigold downstream.
export const MARIGOLD_REFERENCE_INTENSITY = 2.0;
export const MARIGOLD_EMISSIVE = '#F59A24';

export const ENVIRONMENTAL_MARIGOLD_FRACTION = 0.25;
export const ENVIRONMENTAL_MARIGOLD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * ENVIRONMENTAL_MARIGOLD_FRACTION;

export const BOUNDARY_SURFACE = {
    emissive: MARIGOLD_EMISSIVE,
    emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY,
    color: '#15171a',
} as const;

/**
 * Variant C: the strip wearing the DECK's material, marigold added as a ramp. Matching the deck exactly is
 * the point — at the inner lip there must be nothing to read as a line. Cool emissive deliberately dropped.
 */
export function boundarySoftSurface() {
    return {
        ...floorSurface(),
        emissive: MARIGOLD_EMISSIVE,
        emissiveMap: edgeFalloffRamp(),
    };
}

/** Drag-block opacity pulse bounds (breathed in TrackBlocks' useFrame; the gallery holds it at MAX). */
export const DRAG_OPACITY_MIN = 0.25;
export const DRAG_OPACITY_MAX = 0.5;
/** Radians/sec of the drag pulse → ~2.5 s breath period. */
export const DRAG_PULSE_SPEED = 2.5;
