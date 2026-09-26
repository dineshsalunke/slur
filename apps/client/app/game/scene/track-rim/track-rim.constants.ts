import * as THREE from 'three';
import { MARIGOLD_REFERENCE_INTENSITY } from '../track-materials';

export const CORD_RADIUS = 0.08;
export const CORD_SEGMENTS = 8;
export const CORD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY;
export const CORD_DEPTH_BIAS = -2;

export const _m = new THREE.Matrix4();
export const _q = new THREE.Quaternion();
export const _pos = new THREE.Vector3();
export const _scale = new THREE.Vector3();
export const ALONG_Z = new THREE.Euler( Math.PI / 2, 0, 0 );
export const ALONG_X = new THREE.Euler( 0, 0, Math.PI / 2 );
