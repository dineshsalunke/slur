import { trackSurfaceTexture } from './track-texture';

export const FLOOR_ROUGHNESS = 0.4;

export const FLOOR_METALNESS = 0.75;

export const FLOOR_ENV_MAP_INTENSITY = 1;

export function floorSurface() {
    return {
        color: '#ffffff',
        map: trackSurfaceTexture(),
        roughness: FLOOR_ROUGHNESS,
        metalness: FLOOR_METALNESS,
    };
}

export const LETHAL_SURFACE = {
    emissive: '#ff2740',
    emissiveIntensity: 2.2,
    color: '#1a0206',
} as const;

export const DRAG_SURFACE = {
    emissive: '#ffa51f',
    emissiveIntensity: 1.6,
    color: '#2a1600',
    transparent: true,
    depthWrite: false,
} as const;

export const MARIGOLD_REFERENCE_INTENSITY = 2.0;
export const MARIGOLD_EMISSIVE = '#F59A24';

export const ENVIRONMENTAL_MARIGOLD_FRACTION = 0.25;
export const ENVIRONMENTAL_MARIGOLD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * ENVIRONMENTAL_MARIGOLD_FRACTION;

export const BOUNDARY_SURFACE = {
    emissive: MARIGOLD_EMISSIVE,
    emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY,
    color: '#15171a',
} as const;

export const RAIL_EMITTER_INTENSITY = 40;
export const RAIL_EMITTER_RANGE = 600;
export const RAIL_EMITTER_DECAY = 1;
export const RAIL_EMITTER_LIFT = 0.5;

export const DRAG_OPACITY_MIN = 0.25;
export const DRAG_OPACITY_MAX = 0.5;
export const DRAG_PULSE_SPEED = 2.5;
