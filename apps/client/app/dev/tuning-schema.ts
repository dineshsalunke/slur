import { ACCENT_ANCHOR } from '../game/scene/accent';
import { GRAPHITE_ALBEDO, GRAPHITE_METALNESS, GRAPHITE_ROUGHNESS } from '../game/scene/graphite';

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

export const NUMBER_TUNABLES = {
    'Environment.intensity': { value: 1, min: 0, max: 20, step: 0.05, rebuild: false },
    'Environment.rotation': { value: 0, min: 0, max: 360, step: 1, rebuild: false },

    'Env.skyIntensity': { value: 0.4, min: 0, max: 5, step: 0.01, rebuild: false },
    'Env.groundIntensity': { value: 0.22, min: 0, max: 5, step: 0.01, rebuild: false },
    'Env.bandIntensity': { value: 0.4, min: 0, max: 4, step: 0.05, rebuild: false },
    'Env.bandHeight': { value: 5, min: 0.5, max: 60, step: 0.5, rebuild: false },

    'RailLight.intensity': { value: 3, min: 0, max: 200, step: 0.5, rebuild: false },
    'RailLight.span': { value: 60, min: 4, max: 400, step: 1, rebuild: false },
    'RailLight.thickness': { value: 0.6, min: 0.05, max: 8, step: 0.05, rebuild: false },
    'RailLight.lift': { value: 0.6, min: 0, max: 12, step: 0.05, rebuild: false },
    'RailLight.stride': { value: 55, min: 4, max: 400, step: 1, rebuild: false },
    'RailLight.offset': { value: 10, min: -120, max: 240, step: 1, rebuild: false },

    'Bloom.intensity': { value: 1.2, min: 0, max: 5, step: 0.05, rebuild: false },
    'Bloom.threshold': { value: 0.6, min: 0, max: 2, step: 0.01, rebuild: false },
    'Bloom.smoothing': { value: 0.2, min: 0, max: 1, step: 0.01, rebuild: false },

    'NearFill.intensity': { value: 40, min: 0, max: 400, step: 1, rebuild: false },
    'NearFill.forward': { value: 6, min: -10, max: 30, step: 0.5, rebuild: false },
    'NearFill.height': { value: 3, min: -5, max: 20, step: 0.5, rebuild: false },
    'NearFill.distance': { value: 45, min: 5, max: 200, step: 1, rebuild: false },

    'Fill.intensity': { value: 0.35, min: 0, max: 3, step: 0.01, rebuild: false },
    'Fill.elevation': { value: 35, min: -20, max: 89, step: 1, rebuild: false },
    'Fill.azimuth': { value: 25, min: -90, max: 90, step: 1, rebuild: false },

    'Deck.metalness': { value: GRAPHITE_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Deck.roughness': { value: GRAPHITE_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Deck.envMapIntensity': { value: 1, min: 0, max: 6, step: 0.05, rebuild: false },
    'Deck.normalScale': { value: 0.8, min: 0, max: 3, step: 0.01, rebuild: false },
    'Deck.plate': { value: 4, min: 1, max: 24, step: 1, rebuild: true },
    'Deck.seamEmissive': { value: 2, min: 0, max: 10, step: 0.05, rebuild: false },

    'Rail.metalness': { value: GRAPHITE_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Rail.roughness': { value: GRAPHITE_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Rail.envMapIntensity': { value: 1, min: 0, max: 6, step: 0.05, rebuild: false },
    'Rail.normalScale': { value: 0.8, min: 0, max: 3, step: 0.01, rebuild: false },
    'Rail.plate': { value: 4, min: 1, max: 24, step: 1, rebuild: true },
    'Rail.railEmissive': { value: 2, min: 0, max: 10, step: 0.05, rebuild: false },
    'Rail.rimEmissive': { value: 2, min: 0, max: 30, step: 0.05, rebuild: false },

    'Monolith.metalness': { value: GRAPHITE_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Monolith.roughness': { value: GRAPHITE_ROUGHNESS, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Monolith.envMapIntensity': { value: 1.55, min: 0, max: 6, step: 0.05, rebuild: false },
    'Monolith.plate': { value: 17, min: 4, max: 40, step: 1, rebuild: true },
    'Monolith.seamEmissive': { value: 2, min: 0, max: 10, step: 0.05, rebuild: false },

    'Block.textureSpan': { value: 2, min: 0.25, max: 16, step: 0.05, rebuild: false },
    'Block.normalScale': { value: 1, min: 0, max: 3, step: 0.01, rebuild: false },
    'Block.roughness': { value: 0.52, min: 0.02, max: 1, step: 0.01, rebuild: false },
    'Block.metalness': { value: GRAPHITE_METALNESS, min: 0, max: 1, step: 0.01, rebuild: false },
    'Block.envMapIntensity': { value: 1, min: 0, max: 6, step: 0.05, rebuild: false },
    'Block.seamEmissive': { value: 6, min: 0, max: 20, step: 0.05, rebuild: false },
    'Block.wear': { value: 0.6, min: 0, max: 1, step: 0.01, rebuild: false },

    'Groove.width': { value: 0.15, min: 0.02, max: 1.2, step: 0.01, rebuild: true },
    'Groove.wallTilt': { value: 0.05, min: 0, max: 0.8, step: 0.01, rebuild: true },
    'Groove.bevelShare': { value: 0.05, min: 0, max: 0.5, step: 0.01, rebuild: true },
    'Groove.metalness': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.roughness': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.darkening': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.cavity': { value: 0.3, min: 0, max: 1, step: 0.01, rebuild: true },

    'RearView.fov': { value: 36, min: 15, max: 100, step: 1, rebuild: false },
    'RearView.lift': { value: 3, min: 0, max: 12, step: 0.1, rebuild: false },
    'RearView.tilt': { value: 4, min: -20, max: 30, step: 0.5, rebuild: false },
    'RearView.gain': { value: 1, min: 0, max: 2, step: 0.01, rebuild: false },
    'RearView.featherX': { value: 0.22, min: 0, max: 0.5, step: 0.01, rebuild: false },
    'RearView.featherY': { value: 0.18, min: 0, max: 0.5, step: 0.01, rebuild: false },
    'RearView.scale': { value: 1, min: 0.5, max: 2, step: 0.05, rebuild: true },
} as const satisfies Record< string, NumberTunable >;

export const COLOR_TUNABLES = {
    'Env.skyColor': { value: '#97979a', rebuild: false },
    'Env.groundColor': { value: '#343639', rebuild: false },
    'Env.bandColor': { value: ACCENT_ANCHOR, rebuild: false },
    'NearFill.color': { value: '#ffb964', rebuild: false },
    'RailLight.color': { value: ACCENT_ANCHOR, rebuild: false },
    'Fill.color': { value: '#bcc0c4', rebuild: false },
    'Deck.plateColor': { value: GRAPHITE_ALBEDO, rebuild: true },
    'Rail.plateColor': { value: GRAPHITE_ALBEDO, rebuild: true },
    'Monolith.plateColor': { value: GRAPHITE_ALBEDO, rebuild: true },
} as const satisfies Record< string, ColorTunable >;

export type NumberPath = keyof typeof NUMBER_TUNABLES;
export type ColorPath = keyof typeof COLOR_TUNABLES;
