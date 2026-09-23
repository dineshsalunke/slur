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
    'planetSize',
    'planetAzimuth',
    'planetElevation',
    'planetPhase',
    'planetTilt',
    'planetLight',
    'moons',
    'moonSize',
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
    hue: 215,
    saturation: 0.12,
    brightness: 1.05,
    voidDepth: 0.4,
    clumps: 0.5,
    dustOpacity: 0.6,
    rim: 0.8,
    planetSize: 0,
    planetAzimuth: 14,
    planetElevation: 20,
    planetPhase: 95,
    planetTilt: 50,
    planetLight: 0.7,
    moons: 2,
    moonSize: 1.6,
    motion: 1,
    environment: 3.5,
    keyLight: 8,
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
    planetSize: 17,
    planetLight: 1,
    moons: 0,
    environment: 2.5,
    keyLight: 5,
};
