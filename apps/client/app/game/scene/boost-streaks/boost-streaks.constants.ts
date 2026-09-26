import * as THREE from 'three';

export const MAX_SHIPS = 12;
export const PER_SHIP = 2;
export const MAX_STREAKS = MAX_SHIPS * PER_SHIP;
export const AFTER_RENDER_SYNC = 0.25;
export const SIDES = [ -1, 1 ];

export const _ship = new THREE.Matrix4();
export const _local = new THREE.Matrix4();
export const _instance = new THREE.Matrix4();
export const _offset = new THREE.Vector3();
export const _scale = new THREE.Vector3();
export const _identity = new THREE.Quaternion();
