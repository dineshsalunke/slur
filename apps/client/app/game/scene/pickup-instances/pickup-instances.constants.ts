import * as THREE from 'three';
import type { PickupPose } from '../pickup-pose';

export const _o = new THREE.Object3D();
export const _pool = new THREE.Object3D();
export const _pose: PickupPose = { scale: 1, lift: 0, spin: 0 };
export const TAU = Math.PI * 2;
