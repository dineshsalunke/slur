import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import { ACCENT_ANCHOR } from '../game/scene/accent';
import { ROCK_ALBEDO } from '../game/scene/asteroid-surface';
import {
    METAL_BASE_COLOR,
    METAL_MAP_TINT,
    METAL_METALNESS,
    METAL_ROUGHNESS,
    STONE_METALNESS,
    STONE_ROUGHNESS,
} from '../game/scene/metal';
import { NEBULA_PRESET } from '../game/scene/nebula-presets';

interface NumberTunable {
    value: number;
    min: number;
    max: number;
    step: number;
    rebuild: boolean;
}

interface ColorTunable {
    value: string;
    rebuild: boolean;
}

const DEVICE_DPR = Math.max( 0.5, globalThis.devicePixelRatio ?? 1 );

export const NUMBER_TUNABLES = {
    'Render.dpr': { value: Math.min( 2, DEVICE_DPR ), min: 0.5, max: DEVICE_DPR, step: 0.25, rebuild: false },

    'Environment.intensity': { value: 1.2, min: 0, max: 20, step: 0.05, rebuild: false },
    'Environment.rotation': { value: 0, min: 0, max: 360, step: 1, rebuild: false },

    'Env.skyIntensity': { value: 0.6, min: 0, max: 5, step: 0.01, rebuild: false },
    'Env.fillIntensity': { value: 0.5, min: 0, max: 2, step: 0.01, rebuild: false },
    'Env.groundIntensity': { value: 0.5, min: 0, max: 5, step: 0.01, rebuild: false },
    'Env.bandIntensity': { value: 0.1, min: 0, max: 4, step: 0.05, rebuild: false },
    'Env.bandHeight': { value: 5, min: 0.5, max: 60, step: 0.5, rebuild: false },

    'RailLight.intensity': { value: 6, min: 0, max: 30, step: 0.1, rebuild: false },
    'RailLight.lift': { value: 0.6, min: 0, max: 12, step: 0.05, rebuild: false },

    'Bloom.intensity': { value: 1.2, min: 0, max: 5, step: 0.05, rebuild: false },
    'Bloom.threshold': { value: 0.6, min: 0, max: 2, step: 0.01, rebuild: false },
    'Bloom.smoothing': { value: 0.2, min: 0, max: 1, step: 0.01, rebuild: false },

    'NearFill.intensity': { value: 40, min: 0, max: 400, step: 1, rebuild: false },
    'NearFill.forward': { value: 6, min: -10, max: 30, step: 0.5, rebuild: false },
    'NearFill.height': { value: 3, min: -5, max: 20, step: 0.5, rebuild: false },
    'NearFill.distance': { value: 45, min: 5, max: 200, step: 1, rebuild: false },

    'Fill.intensity': { value: 1, min: 0, max: 3, step: 0.01, rebuild: false },
    'Fill.elevation': { value: 35, min: -20, max: 89, step: 1, rebuild: false },
    'Fill.azimuth': { value: 25, min: -90, max: 90, step: 1, rebuild: false },

    'Deck.metalness': { value: METAL_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Deck.roughness': { value: METAL_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Deck.envMapIntensity': { value: 1.5, min: 0, max: 6, step: 0.05, rebuild: false },
    'Deck.normalScale': { value: 0.8, min: 0, max: 3, step: 0.01, rebuild: false },
    'Deck.plate': { value: 4, min: 1, max: 24, step: 1, rebuild: true },
    'Deck.seamEmissive': { value: 2, min: 0, max: 10, step: 0.05, rebuild: false },

    'Rail.metalness': { value: METAL_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Rail.roughness': { value: METAL_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Rail.envMapIntensity': { value: 1.5, min: 0, max: 6, step: 0.05, rebuild: false },
    'Rail.normalScale': { value: 0.8, min: 0, max: 3, step: 0.01, rebuild: false },
    'Rail.plate': { value: 4, min: 1, max: 24, step: 1, rebuild: true },
    'Rail.railEmissive': { value: 2, min: 0, max: 10, step: 0.05, rebuild: false },
    'Rail.rimEmissive': { value: 2, min: 0, max: 30, step: 0.05, rebuild: false },

    'Monolith.metalness': { value: STONE_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Monolith.roughness': { value: STONE_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Monolith.envMapIntensity': { value: 1.55, min: 0, max: 6, step: 0.05, rebuild: false },
    'Monolith.textureSpan': { value: 8, min: 0.25, max: 16, step: 0.05, rebuild: false },
    'Monolith.normalScale': { value: 1, min: 0, max: 3, step: 0.01, rebuild: false },
    'Monolith.seamEmissive': { value: 2, min: 0, max: 10, step: 0.05, rebuild: false },

    'Block.textureSpan': { value: 2, min: 0.25, max: 16, step: 0.05, rebuild: false },
    'Block.normalScale': { value: 1, min: 0, max: 3, step: 0.01, rebuild: false },
    'Block.roughness': { value: STONE_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Block.metalness': { value: STONE_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Block.envMapIntensity': { value: 2, min: 0, max: 6, step: 0.05, rebuild: false },
    'Block.seamEmissive': { value: 6, min: 0, max: 20, step: 0.05, rebuild: false },
    'Block.wear': { value: 0.6, min: 0, max: 1, step: 0.01, rebuild: false },

    'Fracture.gap': { value: 0.3, min: 0, max: 0.8, step: 0.01, rebuild: false },
    'Fracture.glow': { value: 10, min: 0, max: 40, step: 0.1, rebuild: false },
    'Fracture.coreDepth': { value: 0.8, min: 0.05, max: 4, step: 0.05, rebuild: false },
    'Fracture.preGlow': { value: 3, min: 0, max: 12, step: 0.1, rebuild: false },
    'Fracture.preReach': { value: 40, min: 4, max: 200, step: 1, rebuild: false },

    'Break.life': { value: 0.9, min: 0.2, max: 3, step: 0.05, rebuild: false },
    'Break.speed': { value: 9, min: 0, max: 60, step: 0.5, rebuild: false },
    'Break.side': { value: 7, min: 0, max: 40, step: 0.5, rebuild: false },
    'Break.up': { value: 6, min: 0, max: 40, step: 0.5, rebuild: false },
    'Break.spin': { value: 6, min: 0, max: 30, step: 0.25, rebuild: false },
    'Break.gravity': { value: 28, min: 0, max: 120, step: 1, rebuild: false },
    'Break.flare': { value: 0.3, min: 0, max: 12, step: 0.1, rebuild: false },
    'Break.flashLife': { value: 0.18, min: 0.05, max: 1.5, step: 0.01, rebuild: false },
    'Break.flashSize': { value: 0.8, min: 0, max: 5, step: 0.05, rebuild: false },
    'Break.flashBright': { value: 2, min: 0, max: 20, step: 0.1, rebuild: false },

    'Groove.width': { value: 0.15, min: 0.02, max: 1.2, step: 0.01, rebuild: true },
    'Groove.wallTilt': { value: 0.05, min: 0, max: 0.8, step: 0.01, rebuild: true },
    'Groove.bevelShare': { value: 0.05, min: 0, max: 0.5, step: 0.01, rebuild: true },
    'Groove.metalness': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.roughness': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.darkening': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.cavity': { value: 0.3, min: 0, max: 1, step: 0.01, rebuild: true },

    'Hover.base': { value: 0.35, min: 0, max: 4, step: 0.01, rebuild: false },
    'Hover.speedLift': { value: 0.9, min: 0, max: 6, step: 0.01, rebuild: false },
    'Hover.follow': { value: 4, min: 0.2, max: 30, step: 0.1, rebuild: false },
    'Hover.bob': { value: 0.06, min: 0, max: 1, step: 0.01, rebuild: false },
    'Hover.bobRate': { value: 0.8, min: 0, max: 5, step: 0.05, rebuild: false },

    'Seeker.flyY': { value: DEFAULT_SIM_CONFIG.seekerFlyY, min: 0.5, max: 7, step: 0.1, rebuild: false },

    'Shadow.opacity': { value: 0.8, min: 0, max: 1, step: 0.01, rebuild: false },
    'Shadow.size': { value: 2.4, min: 0.5, max: 10, step: 0.05, rebuild: false },
    'Shadow.spread': { value: 0.35, min: 0, max: 3, step: 0.01, rebuild: false },
    'Shadow.softness': { value: 1.2, min: 0.3, max: 8, step: 0.05, rebuild: false },
    'Shadow.blur': { value: 0.25, min: 0, max: 2, step: 0.01, rebuild: false },
    'Shadow.reach': { value: 9, min: 1, max: 40, step: 0.5, rebuild: false },
    'Shadow.lift': { value: 0.03, min: 0.001, max: 0.5, step: 0.001, rebuild: false },

    'Chase.back': { value: 14, min: 2, max: 40, step: 0.5, rebuild: false },
    'Chase.backStretch': { value: 0, min: 0, max: 20, step: 0.5, rebuild: false },
    'Chase.height': { value: 4, min: 0, max: 25, step: 0.1, rebuild: false },
    'Chase.lookAhead': { value: 17, min: 0, max: 60, step: 0.5, rebuild: false },
    'Chase.lookAtLift': { value: 3, min: -5, max: 15, step: 0.1, rebuild: false },
    'Chase.fov': { value: 70, min: 40, max: 120, step: 1, rebuild: false },
    'Chase.fovStretch': { value: 0, min: 0, max: 40, step: 0.5, rebuild: false },
    'Chase.follow': { value: 20, min: 1, max: 60, step: 0.5, rebuild: false },

    'RearView.fov': { value: 36, min: 15, max: 100, step: 1, rebuild: false },
    'RearView.lift': { value: 3, min: 0, max: 12, step: 0.1, rebuild: false },
    'RearView.tilt': { value: 4, min: -20, max: 30, step: 0.5, rebuild: false },
    'RearView.gain': { value: 1, min: 0, max: 2, step: 0.01, rebuild: false },
    'RearView.featherX': { value: 0.22, min: 0, max: 0.5, step: 0.01, rebuild: false },
    'RearView.featherY': { value: 0.18, min: 0, max: 0.5, step: 0.01, rebuild: false },
    'RearView.scale': { value: 1, min: 0.5, max: 2, step: 0.05, rebuild: true },

    'Exhaust.length': { value: 1.4, min: 0.5, max: 24, step: 0.1, rebuild: false },
    'Exhaust.spread': { value: 1.6, min: 0.5, max: 5, step: 0.05, rebuild: false },
    'Exhaust.glow': { value: 11, min: 0, max: 20, step: 0.05, rebuild: false },
    'Exhaust.idle': { value: 0.35, min: 0, max: 1, step: 0.01, rebuild: false },
    'Exhaust.softness': { value: 2.2, min: 0.2, max: 8, step: 0.05, rebuild: false },
    'Exhaust.falloff': { value: 1.6, min: 0.2, max: 8, step: 0.05, rebuild: false },
    'Exhaust.heat': { value: 1, min: 0.2, max: 8, step: 0.05, rebuild: false },

    'EngineLight.intensity': { value: 18, min: 0, max: 200, step: 0.5, rebuild: false },
    'EngineLight.distance': { value: 14, min: 1, max: 80, step: 0.5, rebuild: false },
    'EngineLight.back': { value: 3.4, min: 0, max: 14, step: 0.1, rebuild: false },
    'EngineLight.lift': { value: 0.5, min: -2, max: 6, step: 0.05, rebuild: false },

    'Sky.seed': { value: NEBULA_PRESET.seed, min: 0, max: 99, step: 1, rebuild: false },
    'Sky.scale': { value: NEBULA_PRESET.scale, min: 0.5, max: 6, step: 0.05, rebuild: false },
    'Sky.warp': { value: NEBULA_PRESET.warp, min: 0, max: 3, step: 0.05, rebuild: false },
    'Sky.bandTilt': { value: NEBULA_PRESET.bandTilt, min: 0, max: 180, step: 1, rebuild: false },
    'Sky.bandOffset': { value: NEBULA_PRESET.bandOffset, min: -1, max: 1, step: 0.01, rebuild: false },
    'Sky.bandWidth': { value: NEBULA_PRESET.bandWidth, min: 0.05, max: 1, step: 0.01, rebuild: false },
    'Sky.density': { value: NEBULA_PRESET.density, min: 0, max: 1, step: 0.01, rebuild: false },
    'Sky.voids': { value: NEBULA_PRESET.voids, min: 0, max: 1, step: 0.01, rebuild: false },
    'Sky.dust': { value: NEBULA_PRESET.dust, min: 0, max: 1, step: 0.01, rebuild: false },
    'Sky.hue': { value: NEBULA_PRESET.hue, min: 0, max: 360, step: 1, rebuild: false },
    'Sky.saturation': { value: NEBULA_PRESET.saturation, min: 0, max: 1, step: 0.01, rebuild: false },
    'Sky.brightness': { value: NEBULA_PRESET.brightness, min: 0, max: 4, step: 0.01, rebuild: false },
    'Sky.voidDepth': { value: NEBULA_PRESET.voidDepth, min: 0, max: 1, step: 0.01, rebuild: false },
    'Sky.clumps': { value: NEBULA_PRESET.clumps, min: 0.3, max: 0.95, step: 0.01, rebuild: false },
    'Sky.dustOpacity': { value: NEBULA_PRESET.dustOpacity, min: 0, max: 1, step: 0.01, rebuild: false },
    'Sky.rim': { value: NEBULA_PRESET.rim, min: 0, max: 6, step: 0.05, rebuild: false },
    'Sky.planetSize': { value: NEBULA_PRESET.planetSize, min: 0, max: 60, step: 0.5, rebuild: false },
    'Sky.planetAzimuth': { value: NEBULA_PRESET.planetAzimuth, min: -90, max: 90, step: 1, rebuild: false },
    'Sky.planetElevation': { value: NEBULA_PRESET.planetElevation, min: -30, max: 80, step: 1, rebuild: false },
    'Sky.planetPhase': { value: NEBULA_PRESET.planetPhase, min: 0, max: 180, step: 1, rebuild: false },
    'Sky.planetTilt': { value: NEBULA_PRESET.planetTilt, min: -180, max: 180, step: 1, rebuild: false },
    'Sky.planetLight': { value: NEBULA_PRESET.planetLight, min: 0, max: 3, step: 0.05, rebuild: false },
    'Sky.planetGlow': { value: NEBULA_PRESET.planetGlow, min: 0, max: 4, step: 0.05, rebuild: false },
    'Sky.planetRelief': { value: NEBULA_PRESET.planetRelief, min: 0, max: 3, step: 0.05, rebuild: false },
    'Sky.moons': { value: NEBULA_PRESET.moons, min: 0, max: 2, step: 1, rebuild: false },
    'Sky.moonSize': { value: NEBULA_PRESET.moonSize, min: 0.2, max: 6, step: 0.1, rebuild: false },
    'Sky.motion': { value: NEBULA_PRESET.motion, min: 0, max: 4, step: 0.05, rebuild: false },
    'Sky.environment': { value: NEBULA_PRESET.environment, min: 0, max: 6, step: 0.05, rebuild: false },
    'Sky.keyLight': { value: NEBULA_PRESET.keyLight, min: 0, max: 8, step: 0.05, rebuild: false },

    'Rock.textureScale': { value: 1.15, min: 0.2, max: 4, step: 0.05, rebuild: false },
    'Rock.normalScale': { value: 2.5, min: 0, max: 3, step: 0.05, rebuild: false },
    'Rock.roughness': { value: 1, min: 0.1, max: 1.5, step: 0.01, rebuild: false },
    'Rock.detail': { value: 1, min: 0, max: 3, step: 0.05, rebuild: false },
    'Rock.spin': { value: 3.35, min: 0, max: 6, step: 0.05, rebuild: false },
    'Rock.drift': { value: 28, min: 0, max: 120, step: 1, rebuild: false },
    'Rock.driftRate': { value: 1, min: 0, max: 1, step: 0.01, rebuild: false },

    'Ship.envMapIntensity': { value: 0.45, min: 0, max: 3, step: 0.05, rebuild: false },
} as const satisfies Record< string, NumberTunable >;

export const COLOR_TUNABLES = {
    'Env.fillColor': { value: '#8d96a3', rebuild: false },
    'Env.groundColor': { value: '#343639', rebuild: false },
    'Env.bandColor': { value: ACCENT_ANCHOR, rebuild: false },
    'NearFill.color': { value: '#ffb964', rebuild: false },
    'RailLight.color': { value: ACCENT_ANCHOR, rebuild: false },
    'Fill.color': { value: '#bcc0c4', rebuild: false },
    'Rock.color': { value: ROCK_ALBEDO, rebuild: false },
    'Metal.baseColor': { value: METAL_BASE_COLOR, rebuild: true },
    'Metal.mapTint': { value: METAL_MAP_TINT, rebuild: false },
    'Shadow.color': { value: '#01040a', rebuild: false },
    'Exhaust.hot': { value: '#fff1dc', rebuild: false },
    'Exhaust.cool': { value: ACCENT_ANCHOR, rebuild: false },
    'EngineLight.color': { value: '#ff9a3c', rebuild: false },
} as const satisfies Record< string, ColorTunable >;

export type NumberPath = keyof typeof NUMBER_TUNABLES;
export type ColorPath = keyof typeof COLOR_TUNABLES;
