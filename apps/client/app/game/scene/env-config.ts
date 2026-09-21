export interface DomeConfig {
    enabled: boolean;
    top: string;
    bottom: string;
    radius: number;
}

export interface StarConfig {
    enabled: boolean;
    count: number;
    radius: number;
    depth: number;
    factor: number;
    saturation: number;
    fade: boolean;
    speed: number;
}

export interface FogConfig {
    color: string;
    near: number;
    far: number;
}

export interface BloomConfig {
    intensity: number;
    threshold: number;
    smoothing: number;
    radius: number;
    levels: number;
}

export interface EnvConfig {
    name: string;
    background: string;
    fog: FogConfig;
    dome: DomeConfig;
    stars: StarConfig;
    bloom: BloomConfig;
}

export const ENV_VARIANTS: readonly EnvConfig[] = [
    {
        name: 'A · Deep-Space Drift',
        background: '#02030a',
        fog: { color: '#02030a', near: 140, far: 640 },
        dome: { enabled: false, top: '#050a1a', bottom: '#0a1230', radius: 800 },
        stars: { enabled: true, count: 1200, radius: 320, depth: 80, factor: 4, saturation: 0, fade: true, speed: 0.4 },
        bloom: { intensity: 1.0, threshold: 0.45, smoothing: 0.2, radius: 0.6, levels: 4 },
    },
    {
        name: 'B · Neon Canyon',
        background: '#0a0512',
        fog: { color: '#2a0a3a', near: 40, far: 300 },
        dome: { enabled: true, top: '#160826', bottom: '#3a0f4a', radius: 700 },
        stars: {
            enabled: true,
            count: 3000,
            radius: 250,
            depth: 60,
            factor: 5,
            saturation: 0.2,
            fade: true,
            speed: 0.5,
        },
        bloom: { intensity: 1.4, threshold: 0.4, smoothing: 0.25, radius: 0.6, levels: 4 },
    },
    {
        name: 'C · Grid Void',
        background: '#04060c',
        fog: { color: '#04101c', near: 80, far: 460 },
        dome: { enabled: true, top: '#02060e', bottom: '#08324a', radius: 750 },
        stars: {
            enabled: true,
            count: 8000,
            radius: 190,
            depth: 80,
            factor: 6.5,
            saturation: 0.14,
            fade: true,
            speed: 0.6,
        },
        bloom: { intensity: 1.2, threshold: 0.42, smoothing: 0.2, radius: 0.6, levels: 4 },
    },
] as const;

export const GRID_VOID: EnvConfig = ENV_VARIANTS.find( ( v ) => v.name.startsWith( 'C ·' ) ) ?? ENV_VARIANTS[ 2 ];
