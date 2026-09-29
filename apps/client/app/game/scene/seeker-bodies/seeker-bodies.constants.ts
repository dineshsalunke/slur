import * as THREE from 'three';
import { BOLT_HOT } from '../combat-look';
import { MAX_SEEKERS } from '../seeker-look';
import { TRAIL_POINTS } from '../seeker-trail';

export const MAX_SEGMENTS = MAX_SEEKERS * TRAIL_POINTS;
export const HOT = new THREE.Color( BOLT_HOT );
export const FORWARD = new THREE.Vector3( 0, 0, 1 );
export const _black = new THREE.Color( 0, 0, 0 );
