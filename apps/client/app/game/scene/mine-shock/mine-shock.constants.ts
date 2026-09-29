import { DEFAULT_PORTAL_CONFIG, DEFAULT_SIM_CONFIG } from '@slur/shared';
import type { ShockKind } from '../mine-shock-events';
import type { ShockLook } from './mine-shock';

export const MAX = 16;
export const LIFT = 0.05;
export const UPRIGHT = Math.PI / 2;

const FLAT = { lift: LIFT, upright: false };
const GATE = { lift: DEFAULT_PORTAL_CONFIG.portalY, upright: true };

export const LOOKS: Record< ShockKind, ShockLook > = {
    big: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 3, life: 0.55, bright: 5, collapse: false, ...FLAT },
    small: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 1.6, life: 0.55, bright: 5, collapse: false, ...FLAT },
    fizzle: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 1.6, life: 0.4, bright: 5, collapse: true, ...FLAT },
    portalIn: { reach: DEFAULT_PORTAL_CONFIG.portalR * 1.8, life: 0.35, bright: 6, collapse: true, ...GATE },
    portalOut: { reach: DEFAULT_PORTAL_CONFIG.portalR * 2.4, life: 0.5, bright: 6, collapse: false, ...GATE },
};
