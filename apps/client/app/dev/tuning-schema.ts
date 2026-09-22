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

    'Groove.width': { value: 0.15, min: 0.02, max: 1.2, step: 0.01, rebuild: true },
    'Groove.wallTilt': { value: 0.05, min: 0, max: 0.8, step: 0.01, rebuild: true },
    'Groove.bevelShare': { value: 0.05, min: 0, max: 0.5, step: 0.01, rebuild: true },
    'Groove.metalness': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.roughness': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.darkening': { value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'Groove.cavity': { value: 0.3, min: 0, max: 1, step: 0.01, rebuild: true },
} as const satisfies Record< string, NumberTunable >;

export const COLOR_TUNABLES = {
    'Deck.plateColor': { value: GRAPHITE_ALBEDO, rebuild: true },
    'Rail.plateColor': { value: GRAPHITE_ALBEDO, rebuild: true },
    'Monolith.plateColor': { value: GRAPHITE_ALBEDO, rebuild: true },
} as const satisfies Record< string, ColorTunable >;

export type NumberPath = keyof typeof NUMBER_TUNABLES;
export type ColorPath = keyof typeof COLOR_TUNABLES;
