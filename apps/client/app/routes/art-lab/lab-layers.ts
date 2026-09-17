// Which scene layers the art lab mounts. NOT a component and NOT a per-frame knob.
//
// MECHANISM (non-negotiable #14 — alternatives weighed): these toggles MOUNT/UNMOUNT scene children, so
// they are STRUCTURAL by definition and belong in React state in the route module, flowing down as props.
// Deliberately NOT in `lab-state.ts`: that module is the singleton store for values the rig READS inside
// `useFrame` (paused/ghost/jump), where a re-render would be a bug. Here the re-render IS the effect —
// a singleton would change nothing on screen until something else happened to re-render. Also rejected:
// a koota trait (these own no entity), context (same re-render cost as props, more indirection), and a
// URL search param (survives reload, but adds a router round-trip to a button press in a dev instrument).
//
// DEFAULTS: track ONLY. The lab's primary job is judging the track surface itself, and environment, ships
// and the finish gate are visual noise while doing that. Everything is one click from coming back.

export interface LabLayers {
    /** Deadly/slow blocks and the edge rails (the instanced `TrackView`). Its own floor quads are
     *  hidden automatically whenever `slab` is on, so the two floors never stack or z-fight. */
    hazards: boolean;
    /**
     * The NEW generated slab (`TrackFloor`) — one continuous mesh with real thickness and continuous UVs.
     * Its own toggle rather than a replacement for `TrackView`'s floor, so the two can be compared
     * directly: `track` off + `slab` on shows the new surface alone; both on lines them up. Nothing in the
     * game uses `TrackFloor` yet — this is the review step before it replaces anything.
     */
    slab: boolean;
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

export const DEFAULT_LAB_LAYERS: LabLayers = {
    hazards: true,
    slab: true,
    backdrop: true,
    env: false,
    ships: false,
    finish: false,
};

/** Stable render order for the toggle row (object key order is not a contract worth relying on). */
export const LAB_LAYER_KEYS: readonly LabLayerKey[] = [ 'slab', 'hazards', 'backdrop', 'env', 'ships', 'finish' ];
