import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import * as THREE from 'three';
import type { ShockKind } from '../mine-shock-events';
import type { ShockLook } from './mine-shock';

export const MAX = 16;
export const LIFT = 0.05;

export const LOOKS: Record< ShockKind, ShockLook > = {
    big: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 3, life: 0.55, bright: 5, collapse: false },
    small: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 1.6, life: 0.55, bright: 5, collapse: false },
    fizzle: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 1.6, life: 0.4, bright: 5, collapse: true },
};

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
