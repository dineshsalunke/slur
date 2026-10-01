import * as THREE from 'three';

export const SLOTS = 6;
export const QUEUE = 8;
export const LIFE = 12;
export const HULL_SHRINK = 0.9;
export const SPARK_SLAM = 8;
export const HEAT_PEAK = 1.2;
export const HEAT_HOLD = 0.12;
export const HEAT_START = 0.96;
export const COOL_SHARE = 0.4;
export const SIZE_REFERENCE = 3.6;
export const TEXELS_PER_PIECE = 4;

export const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );
export const _identity = new THREE.Matrix4();
