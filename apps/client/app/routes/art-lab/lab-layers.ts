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
    /** The materialized track ribbon — floors, blocks, hazards (the instanced `TrackView`). */
    track: boolean;
    /**
     * The NEW generated slab (`TrackFloor`) — one continuous mesh with real thickness and continuous UVs.
     * Its own toggle rather than a replacement for `TrackView`'s floor, so the two can be compared
     * directly: `track` off + `slab` on shows the new surface alone; both on lines them up. Nothing in the
     * game uses `TrackFloor` yet — this is the review step before it replaces anything.
     */
    slab: boolean;
    /** Background void, fog, dome, stars and parallax canyon walls. */
    env: boolean;
    /** The ship meshes. The rig, sim and chase camera run regardless — only the mesh is hidden. */
    ships: boolean;
    /** The finish gate at the end of the ribbon. */
    finish: boolean;
}

export type LabLayerKey = keyof LabLayers;

export const DEFAULT_LAB_LAYERS: LabLayers = {
    track: true,
    slab: false,
    env: false,
    ships: false,
    finish: false,
};

/** Stable render order for the toggle row (object key order is not a contract worth relying on). */
export const LAB_LAYER_KEYS: readonly LabLayerKey[] = [ 'track', 'slab', 'env', 'ships', 'finish' ];
