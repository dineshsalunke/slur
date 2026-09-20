// Which scene layers the art lab mounts. NOT a component and NOT a per-frame knob — these mount and
// unmount scene children, so the re-render IS the effect. Per-frame knobs live in `lab-state.ts`.

export interface LabLayers {
    floor: boolean;
    boundary: boolean;
    // Untextured boxes awaiting their own design task, so OFF by default — but one click away, because
    // hazard-to-floor contact shading is a real check that needs a block present.
    blocks: boolean;
    // The nebula patch. Independent of `env` so the track can be judged against "Cold Space" with
    // fog/stars/walls muted.
    backdrop: boolean;
    env: boolean;
    // Hides the ship MESH only — the rig, sim and chase camera keep running.
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
    ships: false,
    shipBox: true,
    finish: false,
};

/** Stable render order for the toggle row (object key order is not a contract worth relying on). */
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
