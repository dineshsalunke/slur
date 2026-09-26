import * as THREE from 'three';
import { ACCENT_ANCHOR } from '../accent';
import type { ShardSpec } from '../vfx-shard-pool';

export const SPEC: ShardSpec = {
    max: 240,
    perBurst: 40,
    lifeMin: 0.5,
    lifeMax: 0.95,
    speed: 16,
    upBias: 6,
    drag: 2.2,
    grav: 18,
};
export const SIZE = 0.16;
export const BRIGHT = 2.6;

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
export const LOCAL_CORE = new THREE.Color( '#FFFBE7' );
export const REMOTE_CORE = new THREE.Color( '#FFB52E' );
export const MARIGOLD = new THREE.Color( ACCENT_ANCHOR );
