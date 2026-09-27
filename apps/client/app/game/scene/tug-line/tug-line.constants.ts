import { DEFAULT_SIM_CONFIG } from '@slur/shared';

export const MAX = 8;
export const HOLD_S = DEFAULT_SIM_CONFIG.tugS;
export const FADE_S = DEFAULT_SIM_CONFIG.tugReleaseS;
export const LIFT = 0.4;
export const BRIGHT = 4;
export const HOOK_BRIGHT = 6;

export const ROPE_SEGMENTS = 32;
export const COIL_SEGMENTS = 10;
export const INSTANCES_PER_TETHER = ROPE_SEGMENTS + COIL_SEGMENTS + 1;

export const ROPE_W = 0.08;
export const HOOK_W = 0.26;
export const HOOK_L = 0.7;
export const MIN_PX = 1.5;

export const HOOK_SPEED = 900;
export const THROW_MIN_S = 0.08;
export const THROW_MAX_S = 0.2;

export const SLACK_AMP = 1.1;
export const SLACK_AMP_PER_U = 0.08;
export const SLACK_WAVES = 2.5;
export const SLACK_TRAVEL_HZ = 5;
export const SLACK_PIN = 0.08;

export const RIPPLE_S = 0.12;
export const RIPPLE_AMP = 0.5;
export const RIPPLE_AMP_PER_U = 0.03;
export const RIPPLE_WIDTH = 0.12;

export const TREMOR_AMP = 0.04;
export const TREMOR_WAVES = 3;
export const TREMOR_HZ = 18;

export const COIL_R = 1.6;
export const COIL_TURNS = 1.25;
export const COIL_SPIN_TURNS = 3;
export const COIL_TAPER = 0.25;
