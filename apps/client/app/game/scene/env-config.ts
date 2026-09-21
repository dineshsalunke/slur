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

export interface WallConfig {
    distance: number;
    thickness: number;
    minHeight: number;
    maxHeight: number;
    spacing: number;
    count: number;
    color: string;
    intensity: number;
    yBase: number;
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
    walls: WallConfig;
    bloom: BloomConfig;
}

export const ENV_VARIANTS: readonly EnvConfig[] = [
    {
        name: 'A · Deep-Space Drift',
        background: '#02030a',
        fog: { color: '#02030a', near: 140, far: 640 },
        dome: { enabled: false, top: '#050a1a', bottom: '#0a1230', radius: 800 },
        stars: { enabled: true, count: 1200, radius: 320, depth: 80, factor: 4, saturation: 0, fade: true, speed: 0.4 },
        walls: {
            distance: 92,
            thickness: 4,
            minHeight: 6,
            maxHeight: 26,
            spacing: 60,
            count: 40,
            color: '#1e6fff',
            intensity: 2.2,
            yBase: 0,
        },
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
        walls: {
            distance: 52,
            thickness: 5,
            minHeight: 30,
            maxHeight: 90,
            spacing: 26,
            count: 80,
            color: '#ff2bd6',
            intensity: 2.8,
            yBase: 0,
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
        walls: {
            distance: 68,
            thickness: 3,
            minHeight: 14,
            maxHeight: 40,
            spacing: 40,
            count: 60,
            color: '#c8d0d8',
            intensity: 2.6,
            yBase: 0,
        },
        bloom: { intensity: 1.2, threshold: 0.42, smoothing: 0.2, radius: 0.6, levels: 4 },
    },
] as const;

export const GRID_VOID: EnvConfig = ENV_VARIANTS.find( ( v ) => v.name.startsWith( 'C ·' ) ) ?? ENV_VARIANTS[ 2 ];
