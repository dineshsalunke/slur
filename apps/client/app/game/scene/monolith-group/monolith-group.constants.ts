import * as THREE from 'three';
import { monolithGeometry } from '../monolith-geometry';

export const scratch = new THREE.Object3D();
export const SEAM_GEOMETRY = monolithGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );
