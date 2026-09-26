import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import * as THREE from 'three';

export const MAX = 8;
export const HOLD_S = DEFAULT_SIM_CONFIG.tugS;
export const FADE_S = DEFAULT_SIM_CONFIG.tugReleaseS;
export const RADIUS = 0.22;
export const LIFT = 0.4;
export const BRIGHT = 4;

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
export const _from = new THREE.Vector3();
export const _to = new THREE.Vector3();
