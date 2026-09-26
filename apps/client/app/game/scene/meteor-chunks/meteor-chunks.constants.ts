import * as THREE from 'three';
import { makeTick } from '../debris-tick';

export const LIMIT = 96;
export const QUEUE = 8;
export const LIFE = 12;
export const CARRY = 0.22;
export const HULL_SHRINK = 0.9;
export const SPARK_SLAM = 8;
export const HEAT_SHARE = 0.25;
export const CHUNK_SEED = 0x5eed_c4ac;
export const CHUNK_DETAIL = 3;
export const BASE_COUNT = 9;
export const COUNT_PER_SIZE = 2.2;

export const _m = new THREE.Matrix4();
export const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );
export const _tick = makeTick();
