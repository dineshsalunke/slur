import { DEEP_SPACE, type SkyConfig } from '../../game/scene/sky-config';

export interface SkyTuning {
    backdropBearingDeg: number;
    backdropElevationDeg: number;
    fovDeg: number;
    edgeFadeDeg: number;
    gain: number;
    starBearingDeg: number;
    starElevationDeg: number;
    lightIntensity: number;
    lightColor: string;
    keyIntensity: number;
    keySizeDeg: number;
    keyColor: string;
    fillIntensity: number;
    fillColor: string;
    ambientIntensity: number;
    ambientColor: string;
    toneMapped: boolean;
    starsOn: boolean;
    lightOn: boolean;
    envOn: boolean;
}

export type SkyTuningNumber = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends number ? K : never }[
    keyof SkyTuning
];
export type SkyTuningColour = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends string ? K : never }[
    keyof SkyTuning
];
export type SkyTuningBool = { [ K in keyof SkyTuning ]: SkyTuning[ K ] extends boolean ? K : never }[ keyof SkyTuning ];

function committed(): SkyTuning {
    const b = DEEP_SPACE.backdrop;
    const e = DEEP_SPACE.environment;
    return {
        backdropBearingDeg: b.bearingDeg,
        backdropElevationDeg: b.elevationDeg,
        fovDeg: b.fovDeg,
        edgeFadeDeg: b.edgeFadeDeg,
        gain: b.gain,
        starBearingDeg: DEEP_SPACE.starBearingDeg,
        starElevationDeg: DEEP_SPACE.starElevationDeg,
        lightIntensity: DEEP_SPACE.starLight.intensity,
        lightColor: DEEP_SPACE.starLight.color,
        keyIntensity: e.keyIntensity,
        keySizeDeg: e.keySizeDeg,
        keyColor: e.keyColor,
        fillIntensity: e.fillIntensity,
        fillColor: e.fillColor,
        ambientIntensity: e.ambientIntensity,
        ambientColor: e.ambientColor,
        toneMapped: true,
        starsOn: DEEP_SPACE.stars.enabled,
        lightOn: true,
        envOn: true,
    };
}

export const SKY_TUNING: SkyTuning = committed();

let version = 0;
const listeners = new Set< () => void >();

export function subscribeSkyTuning( fn: () => void ): () => void {
    listeners.add( fn );
    return () => listeners.delete( fn );
}

export function skyTuningVersion(): number {
    return version;
}

export function writeSkyTuning< K extends keyof SkyTuning >( key: K, value: SkyTuning[ K ] ): void {
    if ( key === 'backdropBearingDeg' ) {
        SKY_TUNING.starBearingDeg += ( value as number ) - SKY_TUNING.backdropBearingDeg;
    }
    SKY_TUNING[ key ] = value;
    version++;
    for ( const fn of listeners ) fn();
}

export function resetSkyTuning(): void {
    Object.assign( SKY_TUNING, committed() );
    version++;
    for ( const fn of listeners ) fn();
}

export function tunedSkyConfig(): SkyConfig {
    const t = SKY_TUNING;
    return {
        ...DEEP_SPACE,
        starBearingDeg: t.starBearingDeg,
        starElevationDeg: t.starElevationDeg,
        backdrop: {
            bearingDeg: t.backdropBearingDeg,
            elevationDeg: t.backdropElevationDeg,
            fovDeg: t.fovDeg,
            edgeFadeDeg: t.edgeFadeDeg,
            gain: t.gain,
        },
        stars: { ...DEEP_SPACE.stars, enabled: t.starsOn },
        starLight: { intensity: t.lightIntensity, color: t.lightColor },
        environment: {
            ...DEEP_SPACE.environment,
            keyIntensity: t.keyIntensity,
            keySizeDeg: t.keySizeDeg,
            keyColor: t.keyColor,
            fillIntensity: t.fillIntensity,
            fillColor: t.fillColor,
            ambientIntensity: t.ambientIntensity,
            ambientColor: t.ambientColor,
        },
    };
}

export function skyConfigSnippet(): string {
    const t = SKY_TUNING;
    return [
        `    starBearingDeg: ${ t.starBearingDeg },`,
        `    starElevationDeg: ${ t.starElevationDeg },`,
        '    backdrop: {',
        `        bearingDeg: ${ t.backdropBearingDeg },`,
        `        elevationDeg: ${ t.backdropElevationDeg },`,
        `        fovDeg: ${ t.fovDeg },`,
        `        edgeFadeDeg: ${ t.edgeFadeDeg },`,
        `        gain: ${ t.gain },`,
        '    },',
        `    starLight: { intensity: ${ t.lightIntensity }, color: '${ t.lightColor }' },`,
        '    environment: {',
        `        resolution: ${ DEEP_SPACE.environment.resolution },`,
        `        keyIntensity: ${ t.keyIntensity },`,
        `        keyColor: '${ t.keyColor }',`,
        `        keySizeDeg: ${ t.keySizeDeg },`,
        `        fillIntensity: ${ t.fillIntensity },`,
        `        fillColor: '${ t.fillColor }',`,
        `        ambientIntensity: ${ t.ambientIntensity },`,
        `        ambientColor: '${ t.ambientColor }',`,
        '    },',
        `    // stars.enabled: ${ t.starsOn } · backdrop toneMapped: ${ t.toneMapped }`,
    ].join( '\n' );
}
