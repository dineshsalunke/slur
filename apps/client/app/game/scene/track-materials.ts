// The ONE definition of what each track surface is made of — `meshStandardMaterial` props, spread onto
// the JSX element. The game and `/art-gallery` spread the same objects so a review cannot drift from what
// ships.
//
// NO `toneMapped: false` HERE, deliberately. Opting out made the art direction's own test — "does the rail
// read marigold in the final tone-mapped frame" — unrunnable. These intensities are authored to survive
// ACES, not to bypass it.

import { trackSurfaceTexture } from './track-texture';

/** Near-black ribbon surface. The neon deliberately lives on the rails, not the slab. */
export const FLOOR_SURFACE = {
    emissive: '#c8d0d8',
    emissiveIntensity: 0.05,
    color: '#050507',
} as const;

/**
 * Base roughness of the track's dark metal. The block's per-fragment roughness is perturbed RELATIVELY
 * around this, so the two dark-metal languages cannot fork when it moves — import it, never copy it.
 */
export const FLOOR_ROUGHNESS = 0.62;

export const FLOOR_METALNESS = 0.12;

/**
 * A function, not a frozen object: `trackSurfaceTexture()` needs `document` and must not run at import.
 * `color` overrides the near-black base because base colour MULTIPLIES the map — at `#050507` the texture
 * crushes to flat black.
 */
export function floorSurface() {
    return {
        ...FLOOR_SURFACE,
        color: '#ffffff',
        map: trackSurfaceTexture(),
        roughness: FLOOR_ROUGHNESS,
        metalness: FLOOR_METALNESS,
    };
}

/**
 * Lethal blocks — touch and you derezz, so danger must read instantly.
 *
 * Still red although the palette excludes red: retoning is the block-design task's call, judged when
 * someone is judging blocks. `TrackBlocks` is its own layer, so this is not in the default review frame.
 */
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

/** Edge rails — the bright grid-line read standing proud of the dark floor. */
export const RAIL_SURFACE = {
    emissive: '#c8d0d8',
    emissiveIntensity: 2.6,
    color: '#15171a',
} as const;

/** Drag-block opacity pulse bounds (breathed in TrackBlocks' useFrame; the gallery holds it at MAX). */
export const DRAG_OPACITY_MIN = 0.25;
export const DRAG_OPACITY_MAX = 0.5;
/** Radians/sec of the drag pulse → ~2.5 s breath period. */
export const DRAG_PULSE_SPEED = 2.5;
