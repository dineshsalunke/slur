import * as THREE from 'three';
import { FRACTURE_CORE_HEX } from '../fractured-block-shader';

export const FLIGHTS = 6;
export const HEAD_LIFT = 0.8;
export const HEAD_ATTRIBUTES = [ 'aMeteorHeat', 'aMeteorVel' ] as const;
export const TRAIL_SECONDS = 0.36;
export const TRAIL_WIDTH = 0.55;
export const TRAIL_GAIN = 2.2;
export const GLOW_SIZE = 0.78;
export const GLOW_GAIN = 0.9;
export const COLLAPSE = 0.16;
export const MIN_SPEED = 30;
export const MAX_SPEED = 160;
export const SPEED_WINDOW = 0.5;
export const PIT_DEPTH = -160;
export const SCAN = 6;
export const SHAKE_REACH = 140;
export const SHAKE_SIZE = 1.5;
export const PIT_STEP = 8;
export const PIT_TRIES = 4;
export const LIGHT_DISTANCE = 110;
export const LIGHT_GAIN = 700;
export const BURST_SIZE = 3.2;
export const SPARK_BURSTS = 3;

export const UP = new THREE.Vector3( 0, 1, 0 );
export const CORE = new THREE.Color( FRACTURE_CORE_HEX );
export const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );
