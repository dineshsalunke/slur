// The ONE definition of what each track surface is made of.
//
// WHY THIS MODULE EXISTS: `/art-gallery` shows these surfaces in isolation so they can be judged against
// the frozen art direction. If the gallery hand-rolled its own cube with "the same" emissive values, the
// two would drift the first time anyone retuned the track — and a gallery that lies about the game is
// worse than no gallery. Both `TrackView` (instanced, in-game) and the gallery now spread the SAME object,
// so divergence is impossible by construction rather than by discipline.
//
// These are `meshStandardMaterial` props, spread directly onto the JSX element.
//
// NO `toneMapped: false` HERE. Every surface used to opt out of the tone map, which made the art
// direction's own test — "does the rail read marigold in the final tone-mapped frame" — unrunnable by
// construction. The renderer default stands (r3f's `<Canvas>` sets ACES Filmic unless `flat` is passed,
// which nothing does), so these intensities are authored to survive that transform rather than bypass it.

import { trackSurfaceTexture } from './track-texture';

/** Near-black ribbon surface. The neon deliberately lives on the rails, not the slab. */
export const FLOOR_SURFACE = {
    emissive: '#c8d0d8',
    emissiveIntensity: 0.05,
    color: '#050507',
} as const;

/**
 * Base roughness of the track's dark metal. THE constant the finish is defined by: `art/block` perturbs
 * its per-fragment roughness RELATIVELY around this, so the two dark-metal languages cannot fork when it
 * moves. Import it; never copy the number.
 */
export const FLOOR_ROUGHNESS = 0.62;

/**
 * Low, pending slice 2. The original reason ("no environment map in this scene") is FALSE since the lab
 * lost its own lights and the shipped sky rig brought `SkyEnvironment`.
 */
export const FLOOR_METALNESS = 0.12;

/**
 * The game floor's real material — the ONE definition, spread by both `TrackFloor` and the gallery so a
 * review cannot drift from what ships. A function, not a frozen object: `trackSurfaceTexture()` needs
 * `document` and must not run at import time.
 *
 * `color` overrides FLOOR_SURFACE's near-black because base colour MULTIPLIES the map — at `#050507` the
 * texture crushes to flat black.
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
 * Lethal blocks — the lone red accent. Touch → derezz, so danger must read instantly.
 *
 * STILL RED, DELIBERATELY. The palette excludes red and these will change — but that is the block-design
 * task's call, judged when someone is judging blocks. Task 2 took the blocks out of the art-lab's default
 * frame instead (`TrackBlocks` is its own layer), so there is no forbidden colour in shot to hold-retone.
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
