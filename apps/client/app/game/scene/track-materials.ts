import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { ACCENT_ANCHOR } from './accent';
import { METAL_METALNESS, METAL_ROUGHNESS } from './metal';
import {
    deckSurfaceParams,
    graphiteSurfaceParams,
    NORMAL_SIGN_X,
    NORMAL_SIGN_Y,
    ROUGHNESS_MAP_BASE,
    type SurfaceParams,
    surfaceMaps,
    wallSurfaceParams,
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
        num( 'Deck.roughness' ),
        num( 'Deck.metalness' ),
        num( 'Deck.normalScale' ),
    );
}

export function graphiteSurface() {
    return plateSurface(
        wallSurfaceParams(),
        num( 'Deck.roughness' ),
        num( 'Deck.metalness' ),
        num( 'Deck.normalScale' ),
    );
}

export function railBodySurface() {
    return plateSurface(
        graphiteSurfaceParams(),
        num( 'Rail.roughness' ),
        num( 'Rail.metalness' ),
        num( 'Rail.normalScale' ),
    );
}

export function graphiteShellMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial( {
        color: col( 'Metal.baseColor' ),
        metalness: METAL_METALNESS,
        roughness: METAL_ROUGHNESS,
        flatShading: true,
    } );
}

export const MARIGOLD_REFERENCE_INTENSITY = 2.0;
export const MARIGOLD_EMISSIVE = ACCENT_ANCHOR;

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
