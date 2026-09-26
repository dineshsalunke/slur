import * as THREE from 'three';
import { FRACTURE_CORE_HEX } from '../fractured-block-shader';

export const SLOTS = 16;

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
export const CORE = new THREE.Color( FRACTURE_CORE_HEX );
export const GEOMETRY = new THREE.IcosahedronGeometry( 0.5, 2 );
