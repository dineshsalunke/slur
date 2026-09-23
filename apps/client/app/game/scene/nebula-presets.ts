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
    'planetGlow',
    'planetRelief',
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
    seed: 51,
    scale: 3.95,
    warp: 0.1,
    bandTilt: 122,
    bandOffset: -0.1,
    bandWidth: 0.17,
    density: 1,
    voids: 0.5,
    dust: 0.49,
    hue: 215,
    saturation: 0.36,
    brightness: 0.89,
    voidDepth: 0.85,
    clumps: 0.39,
    dustOpacity: 0.79,
    rim: 0.7,
    planetSize: 21,
    planetAzimuth: 30,
    planetElevation: 20,
    planetPhase: 95,
    planetTilt: -121,
    planetLight: 1.7,
    planetGlow: 1,
    planetRelief: 1,
    moons: 0,
    moonSize: 0.2,
    motion: 4,
    environment: 0.85,
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
