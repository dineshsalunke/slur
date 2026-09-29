export const QUALITY_TIERS = [ 'low', 'medium', 'high' ] as const;

export type QualityTier = ( typeof QUALITY_TIERS )[ number ];

export type HdriResolution = '1k' | '2k';

export interface QualityProfile {
    landing3d: boolean;
    surfaceRes: number;
    hdriRes: HdriResolution;
    dprCap: number;
    msaa: boolean;
    post: boolean;
    rocks: boolean;
}

export type QualityFeature = {
    [ K in keyof QualityProfile ]: QualityProfile[ K ] extends boolean ? K : never;
}[ keyof QualityProfile ];

export const PROFILES: Record< QualityTier, QualityProfile > = {
    low: {
        landing3d: false,
        surfaceRes: 512,
        hdriRes: '1k',
        dprCap: 1,
        msaa: false,
        post: false,
        rocks: false,
    },
    medium: {
        landing3d: true,
        surfaceRes: 512,
        hdriRes: '1k',
        dprCap: 1.5,
        msaa: false,
        post: true,
        rocks: true,
    },
    high: {
        landing3d: true,
        surfaceRes: 1024,
        hdriRes: '2k',
        dprCap: 2,
        msaa: true,
        post: true,
        rocks: true,
    },
};

export const RELOAD_ONLY = [ 'surfaceRes', 'hdriRes' ] as const satisfies readonly ( keyof QualityProfile )[];

export const TIER_LABEL: Record< QualityTier, string > = { low: 'Low', medium: 'Med', high: 'High' };

export const DEFAULT_TIER: QualityTier = 'high';
export const QUALITY_KEY = 'slur:quality';
export const QUALITY_PARAM = 'quality';
export const NO_CANVAS_PARAM = 'nocanvas';

export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|basic render|software/i;
export const WEAK_GPU =
    /intel\(r\)? (uhd|hd) graphics|intel.*(uhd|hd)\b|mali-[gt][0-7]\d\b|adreno.*\b[1-5]\d\d\b|powervr/i;
export const STRONG_GPU = /nvidia|geforce|quadro|radeon|amd|apple m\d|apple gpu/i;
export const FEW_CORES = 4;
export const LOW_MEMORY_GB = 4;

export const DECLINE_FLOOR_FPS = 40;
export const DECLINE_REFRESH_SHARE = 0.67;
