export const SKY_BAKE_KEYS = [
    'seed',
    'scale',
    'warp',
    'bandTilt',
    'bandOffset',
    'bandWidth',
    'density',
    'voids',
    'dust',
] as const;

export const SKY_LOOK_KEYS = [
    'hue',
    'saturation',
    'brightness',
    'voidDepth',
    'clumps',
    'dustOpacity',
    'rim',
] as const;

export const SKY_LIVE_KEYS = [ 'motion', 'environment', 'keyLight' ] as const;

export type SkyBakeKey = ( typeof SKY_BAKE_KEYS )[ number ];
export type SkyLookKey = ( typeof SKY_LOOK_KEYS )[ number ];
export type SkyLiveKey = ( typeof SKY_LIVE_KEYS )[ number ];
export type SkyKey = SkyBakeKey | SkyLookKey | SkyLiveKey;
export type SkyPreset = Record< SkyKey, number >;

export const NEBULA_PRESET: SkyPreset = {
    seed: 7,
    scale: 2.2,
    warp: 1,
    bandTilt: 122,
    bandOffset: -0.05,
    bandWidth: 0.2,
    density: 0.65,
    voids: 0.5,
    dust: 0.85,
    hue: 212,
    saturation: 0.28,
    brightness: 1.05,
    voidDepth: 0.4,
    clumps: 0.42,
    dustOpacity: 0.95,
    rim: 1.4,
    motion: 1,
    environment: 2,
    keyLight: 3,
};

export const DEEP_SPACE_PRESET: SkyPreset = {
    ...NEBULA_PRESET,
    bandOffset: 0.62,
    bandWidth: 0.24,
    density: 0.45,
    voids: 0.65,
    dust: 0.35,
    brightness: 0.55,
    clumps: 0.7,
    rim: 1,
    environment: 1.2,
    keyLight: 2,
};
