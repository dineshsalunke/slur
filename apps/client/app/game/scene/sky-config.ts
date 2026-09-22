const DEGREES_PER_RADIAN = 180 / Math.PI;

export function skyDirection( bearingDeg: number, elevationDeg: number ): [ number, number, number ] {
    const bearing = bearingDeg / DEGREES_PER_RADIAN;
    const elevation = elevationDeg / DEGREES_PER_RADIAN;
    const horizontal = Math.cos( elevation );
    return [ -horizontal * Math.sin( bearing ), Math.sin( elevation ), horizontal * Math.cos( bearing ) ];
}

export interface StarFieldConfig {
    enabled: boolean;
    count: number;
    radius: number;
    depth: number;
    size: number;
    saturation: number;
    fade: boolean;
    twinkleSpeed: number;
}

export interface StarLightConfig {
    intensity: number;
    color: string;
}

export interface SkyEnvironmentConfig {
    resolution: number;
    keyIntensity: number;
    keyColor: string;
    keySizeDeg: number;
    fillIntensity: number;
    fillColor: string;
    ambientIntensity: number;
    ambientColor: string;
}

export interface SkyConfig {
    name: string;
    radius: number;
    starBearingDeg: number;
    starElevationDeg: number;
    stars: StarFieldConfig;
    starLight: StarLightConfig;
    environment: SkyEnvironmentConfig;
}

export const DEEP_SPACE: SkyConfig = {
    name: 'Deep Space',
    radius: 800,
    starBearingDeg: 66,
    starElevationDeg: 19,
    stars: {
        enabled: true,
        count: 2200,
        radius: 400,
        depth: 120,
        size: 10,
        saturation: 0,
        fade: true,
        twinkleSpeed: 0.3,
    },
    starLight: {
        intensity: 1.6,
        color: '#e8f0ff',
    },
    environment: {
        resolution: 128,
        keyIntensity: 0.9,
        keyColor: '#cfe0ff',
        keySizeDeg: 60,
        fillIntensity: 0.35,
        fillColor: '#20303f',
        ambientIntensity: 0.12,
        ambientColor: '#2a3646',
    },
};
