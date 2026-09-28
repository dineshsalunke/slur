export const QUALITY_TIERS = [ 'low', 'medium', 'high' ] as const;

export type QualityTier = ( typeof QUALITY_TIERS )[ number ];

export interface QualityProfile {
    landing3d: boolean;
    surfaceRes: number;
    noiseSize: number;
    skyFace: number;
}

export const PROFILES: Record< QualityTier, QualityProfile > = {
    low: { landing3d: false, surfaceRes: 512, noiseSize: 32, skyFace: 512 },
    medium: { landing3d: true, surfaceRes: 512, noiseSize: 64, skyFace: 512 },
    high: { landing3d: true, surfaceRes: 1024, noiseSize: 64, skyFace: 1024 },
};

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
