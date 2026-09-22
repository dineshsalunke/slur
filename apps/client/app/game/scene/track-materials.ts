import * as THREE from 'three';
import { ACCENT_ANCHOR } from './accent';
import {
    deckSurfaceParams,
    monolithSurfaceParams,
    NORMAL_SIGN_X,
    NORMAL_SIGN_Y,
    ROUGHNESS_MAP_BASE,
    railSurfaceParams,
    type SurfaceParams,
    surfaceMaps,
} from './track-texture';

export function cleanToMapRoughness( clean: number ): number {
    return clean / ROUGHNESS_MAP_BASE;
}

function plateSurface( params: SurfaceParams, clean: number, metalness: number, scale: number ) {
    return {
        color: '#ffffff',
        ...surfaceMaps( params ),
        normalScale: new THREE.Vector2( scale * NORMAL_SIGN_X, scale * NORMAL_SIGN_Y ),
        roughness: cleanToMapRoughness( clean ),
        metalness,
    };
}

const DECK_ROUGHNESS = 0.35;
const DECK_METALNESS = 0.9;
const DECK_NORMAL_SCALE = 0.8;

const RAIL_ROUGHNESS = 0.35;
const RAIL_METALNESS = 0.9;
const RAIL_NORMAL_SCALE = 0.8;

const MONO_ROUGHNESS = 0.35;
const MONO_METALNESS = 0.9;

export function floorSurface() {
    return plateSurface( deckSurfaceParams(), DECK_ROUGHNESS, DECK_METALNESS, DECK_NORMAL_SCALE );
}

export function railBodySurface() {
    return plateSurface( railSurfaceParams(), RAIL_ROUGHNESS, RAIL_METALNESS, RAIL_NORMAL_SCALE );
}

export function monolithBodySurface() {
    return plateSurface( monolithSurfaceParams(), MONO_ROUGHNESS, MONO_METALNESS, DECK_NORMAL_SCALE );
}

export const MARIGOLD_REFERENCE_INTENSITY = 2.0;
export const MARIGOLD_EMISSIVE = ACCENT_ANCHOR;

export const ENVIRONMENTAL_MARIGOLD_FRACTION = 0.25;
export const ENVIRONMENTAL_MARIGOLD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * ENVIRONMENTAL_MARIGOLD_FRACTION;

export const BOUNDARY_SURFACE = {
    emissive: MARIGOLD_EMISSIVE,
    emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY,
    color: '#15171a',
} as const;

export const SEAM_SURFACE = {
    emissive: MARIGOLD_EMISSIVE,
    emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY,
    color: '#15171a',
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
} as const;
