import * as THREE from 'three';
import type { RopeOffset } from './rope-curve.utils';
import type { PullRead } from './tug-line.utils';

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
export const _from = new THREE.Vector3();
export const _to = new THREE.Vector3();
export const _start = new THREE.Vector3();
export const _hook = new THREE.Vector3();
export const _dir = new THREE.Vector3();
export const _side = new THREE.Vector3();
export const _up = new THREE.Vector3();
export const _a = new THREE.Vector3();
export const _b = new THREE.Vector3();
export const _offset: RopeOffset = { side: 0, up: 0 };
export const _pull: PullRead = { timer: -1, anchorZ: -1 };
