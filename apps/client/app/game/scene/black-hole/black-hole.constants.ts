import type { QualityTier } from '../../../quality/quality.constants';

export interface TierPlan {
    size: number;
    shadeEvery: number;
    frozen: boolean;
}

export const TIER_PLAN: Record< QualityTier, TierPlan > = {
    high: { size: 512, shadeEvery: 1, frozen: false },
    medium: { size: 384, shadeEvery: 2, frozen: false },
    low: { size: 384, shadeEvery: 1, frozen: true },
};

export const BLACK_HOLE_PARAM = 'blackhole';
export const BLACK_HOLE_PLACEMENTS = [ 'finish' ] as const;

export const BAKE_BANDS = 8;
export const REFINE_BANDS = 24;
export const NOISE_SIZE = 64;
export const NOISE_SEED = 13;
export const DISK_OUTER = 9;
export const BAKE_FOV = 3;

export const DRAW_MAX = 900;
export const MIN_DISTANCE = 40;
export const DEG = Math.PI / 180;
