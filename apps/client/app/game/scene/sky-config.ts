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

export interface SkyConfig {
    name: string;
    radius: number;
    starBearingDeg: number;
    starElevationDeg: number;
    stars: StarFieldConfig;
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
};
