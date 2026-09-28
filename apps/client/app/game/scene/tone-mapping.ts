import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { num } from '../../dev/tuning';

export const TONE_MODE_OPTIONS = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
    AgX: THREE.AgXToneMapping,
    Neutral: THREE.NeutralToneMapping,
} as const;

const COMPOSER_MODES: Partial< Record< THREE.ToneMapping, ToneMappingMode > > = {
    [ THREE.LinearToneMapping ]: ToneMappingMode.LINEAR,
    [ THREE.ReinhardToneMapping ]: ToneMappingMode.REINHARD,
    [ THREE.CineonToneMapping ]: ToneMappingMode.CINEON,
    [ THREE.ACESFilmicToneMapping ]: ToneMappingMode.ACES_FILMIC,
    [ THREE.AgXToneMapping ]: ToneMappingMode.AGX,
    [ THREE.NeutralToneMapping ]: ToneMappingMode.NEUTRAL,
};

export function toneMode(): THREE.ToneMapping {
    return num( 'ToneMapping.mode' ) as THREE.ToneMapping;
}

export function toneExposure(): number {
    return num( 'ToneMapping.exposure' );
}

export function composerToneMode( mode: THREE.ToneMapping ): ToneMappingMode | undefined {
    return COMPOSER_MODES[ mode ];
}
