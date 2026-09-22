import * as THREE from 'three';
import { num } from '../../dev/tunables';
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

export function floorSurface() {
    return plateSurface(
        deckSurfaceParams(),
        num( 'deck.roughness' ),
        num( 'deck.metalness' ),
        num( 'deck.normalScale' ),
    );
}

export function railBodySurface() {
    return plateSurface(
        railSurfaceParams(),
        num( 'rail.roughness' ),
        num( 'rail.metalness' ),
        num( 'rail.normalScale' ),
    );
}

export function monolithBodySurface() {
    return plateSurface(
        monolithSurfaceParams(),
        num( 'mono.roughness' ),
        num( 'mono.metalness' ),
        num( 'deck.normalScale' ),
    );
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
export const MARIGOLD_EMISSIVE = ACCENT_ANCHOR;

export const ENVIRONMENTAL_MARIGOLD_FRACTION = 0.25;
export const ENVIRONMENTAL_MARIGOLD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * ENVIRONMENTAL_MARIGOLD_FRACTION;

export const BOUNDARY_SURFACE = {
    emissive: MARIGOLD_EMISSIVE,
    emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY,
    color: '#15171a',
} as const;

export const RAIL_EMITTER_LIFT = 0.5;

export const DRAG_OPACITY_MIN = 0.25;
export const DRAG_OPACITY_MAX = 0.5;
export const DRAG_PULSE_SPEED = 2.5;
