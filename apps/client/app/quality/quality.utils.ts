import {
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
