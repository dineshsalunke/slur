// Which scene layers the art lab mounts. NOT a component and NOT a per-frame knob.
//
// MECHANISM (alternatives weighed per the project's no-reflexive-primitive rule): these toggles
// mount/unmount scene children, so they are structural and belong in React state in the route module,
// flowing down as props. Deliberately NOT in `lab-state.ts`: that module is the singleton store for values
// the rig READS inside `useFrame`, where a re-render would be a bug. Here the re-render IS the effect — a
// singleton would change nothing on screen until something else happened to re-render. Also rejected: a
// koota trait (these own no entity), context (same re-render cost, more indirection), and a URL search
// param (survives reload, but adds a router round-trip to a button press in a dev instrument).

export interface LabLayers {
    /** The deck (`TrackFloor`). */
    floor: boolean;
    /** The edge rails (`TrackRails`). */
    rails: boolean;
    /**
     * The hazard blocks (`TrackBlocks`). OFF by default: they are untextured boxes awaiting their own
     * design task, and they obscure the deck, rail and gaps this lab exists to judge. One click away
     * because hazard-to-floor contact shading is a real check that needs a block present.
     */
    blocks: boolean;
    /** The placeholder nebula image as scene background. Independent of `env` — it is the "Cold Space"
     *  half of the north star and worth judging the track against even with fog/stars/walls muted. */
    backdrop: boolean;
    /** Fog, dome, stars and parallax canyon walls. */
    env: boolean;
    /** The ship meshes. The rig, sim and chase camera run regardless — only the mesh is hidden. */
    ships: boolean;
    /** The finish gate at the end of the ribbon. */
    finish: boolean;
}

export type LabLayerKey = keyof LabLayers;

// The track surface only. Environment, ships, the finish gate and the blocks are all visual noise while
// judging it, and every one of them is a click from coming back.
export const DEFAULT_LAB_LAYERS: LabLayers = {
    floor: true,
    rails: true,
    blocks: false,
    backdrop: true,
    env: false,
    ships: false,
    finish: false,
};

/** Stable render order for the toggle row (object key order is not a contract worth relying on). */
export const LAB_LAYER_KEYS: readonly LabLayerKey[] = [
    'floor',
    'rails',
    'blocks',
    'backdrop',
    'env',
    'ships',
    'finish',
];
