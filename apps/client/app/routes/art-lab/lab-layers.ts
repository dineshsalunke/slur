export interface LabLayers {
    floor: boolean;
    boundary: boolean;
    blocks: boolean;
    backdrop: boolean;
    env: boolean;
    ships: boolean;
    shipBox: boolean;
    finish: boolean;
}

export type LabLayerKey = keyof LabLayers;

export const DEFAULT_LAB_LAYERS: LabLayers = {
    floor: true,
    boundary: true,
    blocks: false,
    backdrop: true,
    env: false,
    ships: true,
    shipBox: false,
    finish: false,
};

export const LAB_LAYER_KEYS: readonly LabLayerKey[] = [
    'floor',
    'boundary',
    'blocks',
    'backdrop',
    'env',
    'ships',
    'shipBox',
    'finish',
];
