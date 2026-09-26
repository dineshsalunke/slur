import * as THREE from 'three';
import { makeTick } from '../debris-tick';

export const SLOTS = 12;
export const LIFE = 14;
export const LIGHT_MIN = 0.6;
export const LIGHT_MAX = 1.9;
export const LIFT = 0.35;
export const SPARK_SLAM = 9;
export const SMASH_SHAKE = 0.32;
export const BOLT_SHAKE = 0.22;
export const BOLT_SHAKE_REACH = 45;
export const THUD_SLAM = 16;
export const THUD_SHAKE = 0.05;
export const THUD_REACH = 30;

export const _m = new THREE.Matrix4();
export const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );
export const _one = new THREE.Vector3( 1, 1, 1 );
export const _size = new THREE.Vector3();
export const _centre = new THREE.Vector3();
export const _offset = new THREE.Vector3();
export const _half = new THREE.Vector3();
export const _shrink = new THREE.Vector3();
export const _point = new THREE.Vector3();
export const _away = new THREE.Vector3();
export const _tick = makeTick();
