import * as THREE from 'three';
import { MAX_PORTS_PER_SHIP } from '../exhaust-ports';

export const MAX_SHIPS = 12;
export const MAX_PLUMES = MAX_SHIPS * MAX_PORTS_PER_SHIP;
export const SPREAD_AT_IDLE = 0.82;
export const AFTER_RENDER_SYNC = 0.25;

export const _ship = new THREE.Matrix4();
export const _port = new THREE.Matrix4();
export const _instance = new THREE.Matrix4();
