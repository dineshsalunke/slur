import * as THREE from 'three';
import { accent } from '../accent';
import type { ShardSpec } from '../vfx-shard-pool';

export const SPEC: ShardSpec = {
    max: 200,
    perBurst: 22,
    lifeMin: 0.18,
    lifeMax: 0.4,
    speed: 22,
    upBias: 2,
    drag: 4,
    grav: 12,
};
export const WIDTH = 0.07;
export const STREAK_S = 0.035;
export const BRIGHT = 6;

export const FORWARD = new THREE.Vector3( 0, 0, 1 );
export const ENERGY_CORE = new THREE.Color( '#FFFBE7' );
export const SPARK = accent();
