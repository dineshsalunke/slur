import { DEFAULT_PORTAL_CONFIG } from '@slur/shared';
import * as THREE from 'three';
import type { RingSpec, SleeveSpec } from '../portal-ring';

export const MAX_PORTAL_ENDS = 32;
export const PORTAL_ARMED_INTENSITY = 3;
export const PORTAL_IDLE_INTENSITY = 0.7;
export const PORTAL_PULSE_HZ = 2;
export const PORTAL_PULSE_DEPTH = 0.25;

export const GATE_RING: RingSpec = {
    inner: DEFAULT_PORTAL_CONFIG.portalR,
    outer: DEFAULT_PORTAL_CONFIG.portalR + 0.9,
    depth: 1.2,
    wedges: 24,
    seam: 0.07,
    bevel: 0.08,
};
export const GATE_SLEEVE: SleeveSpec = { inset: 0.03, reach: 0.11, proud: 0.015 };
export const GATE_Y = DEFAULT_PORTAL_CONFIG.portalY;

export const FOOT_WIDTH = 1.1;
export const FOOT_X = GATE_RING.outer - 0.3;
export const FOOT_TOP = 0.6;
export const FOOT_DEPTH = GATE_RING.depth * 1.4;

export const LUG_WIDTH = 1.0;
export const LUG_HEIGHT = 0.55;
export const LUG_DEPTH = GATE_RING.depth + 0.2;
export const LUG_Y = GATE_Y + GATE_RING.outer - 0.1 + LUG_HEIGHT / 2;

export const MARK_WIDTH = 0.14;
export const MARK_HEIGHT = LUG_HEIGHT * 0.6;
export const MARK_DEPTH = LUG_DEPTH + 0.04;
export const MARK_GAP = 0.3;
export const MARK_OFFSETS: readonly ( readonly number[] )[] = [ [ 0 ], [ -MARK_GAP / 2, MARK_GAP / 2 ] ];
export const MAX_PORTAL_MARKS = MAX_PORTAL_ENDS * 2;

export const _o = new THREE.Object3D();
export const _c = new THREE.Color();
