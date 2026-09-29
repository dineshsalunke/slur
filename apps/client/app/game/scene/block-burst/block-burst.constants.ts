import * as THREE from 'three';
import { FRACTURE_CORE_HEX } from '../fractured-block-shader';

export const SLOTS = 16;

export const CORE = new THREE.Color( FRACTURE_CORE_HEX );
export const GEOMETRY = new THREE.IcosahedronGeometry( 0.5, 2 );
