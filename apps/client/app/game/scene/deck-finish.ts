import type * as THREE from 'three';
import { num } from '../../dev/tuning';
import { cleanToMapRoughness } from './track-materials';
import { TEX_SPAN_X } from './track-texture';

export function applyDeckFinish( mat: THREE.MeshStandardMaterial ): void {
    mat.metalness = num( 'Deck.metalness' );
    mat.roughness = cleanToMapRoughness( num( 'Deck.roughness' ) );
    mat.envMapIntensity = num( 'Deck.envMapIntensity' );
    const scale = num( 'Deck.normalScale' );
    mat.normalScale.set( scale, scale );
}

export function deckTextureSpan( map: THREE.Texture ): number {
    return TEX_SPAN_X / Math.max( map.repeat.x, 1e-3 );
}
