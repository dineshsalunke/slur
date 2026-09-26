import * as THREE from 'three';
import { FRACTURE_CORE_HEX } from '../fractured-block-shader';

export const LIMIT = 12;
export const QUEUE = 4;
export const SPREAD = 2.6;
export const LIFT = 0.04;
export const FLASH = 0.35;
export const FLASH_SHARE = 0.7;
export const FLICKER = 0.12;
export const EMBER_END = 1;

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
export const CORE = new THREE.Color( FRACTURE_CORE_HEX );
