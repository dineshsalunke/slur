import {
    DECLINE_FLOOR_FPS,
    DECLINE_REFRESH_SHARE,
    FEW_CORES,
    LOW_MEMORY_GB,
    QUALITY_TIERS,
    type QualityTier,
    SOFTWARE_RENDERER,
    STRONG_GPU,
    WEAK_GPU,
} from './quality.constants';

export interface DeviceProbe {
    webgl2: boolean;
    majorCaveat: boolean;
    renderer: string;
    coarse: boolean;
    cores: number;
    memoryGb: number | undefined;
}

export function parseTier( value: string | null | undefined ): QualityTier | null {
    return QUALITY_TIERS.find( ( tier ) => tier === value ) ?? null;
}

export function isSoftwareRenderer( renderer: string ): boolean {
    return SOFTWARE_RENDERER.test( renderer );
}

export function detectTier( probe: DeviceProbe ): QualityTier {
    if ( ! probe.webgl2 || probe.majorCaveat || isSoftwareRenderer( probe.renderer ) ) return 'low';
    const lowMemory = probe.memoryGb !== undefined && probe.memoryGb < LOW_MEMORY_GB;
    if ( WEAK_GPU.test( probe.renderer ) ) return 'low';
    if ( probe.coarse ) return lowMemory ? 'low' : 'medium';
    if ( lowMemory || probe.cores <= FEW_CORES ) return 'low';
    return STRONG_GPU.test( probe.renderer ) ? 'high' : 'medium';
}

export function lowerTier( tier: QualityTier ): QualityTier {
    return QUALITY_TIERS[ Math.max( 0, QUALITY_TIERS.indexOf( tier ) - 1 ) ];
}

export function autoDpr( deviceDpr: number, cap: number ): number {
    return Math.min( Math.max( 1, deviceDpr ), cap );
}

export function declineBounds( refreshRate: number ): [ number, number ] {
    return [ Math.min( DECLINE_FLOOR_FPS, refreshRate * DECLINE_REFRESH_SHARE ), Number.POSITIVE_INFINITY ];
}
