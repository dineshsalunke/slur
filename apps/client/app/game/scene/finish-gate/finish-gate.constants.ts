import * as THREE from 'three';
import { BOLT_HOT } from '../combat-look';
import { MARIGOLD_REFERENCE_INTENSITY } from '../track-materials';

export const CORE_EMISSIVE = new THREE.Color( BOLT_HOT );

export const BAND_WIDTH = 4;
export const BAND_PROUD = 0.4;
export const CORE_WIDTH = 1.25;
export const CORE_PROUD = 0.8;
export const GLOW_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * 2;
export const TILE_ROWS = 3;
export const TILE_HEIGHT = 0.12;
