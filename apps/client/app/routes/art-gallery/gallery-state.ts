// Which subject the camera is framing, as a MODULE SINGLETON.
//
// MECHANISM: the camera rig eases toward the focused subject every frame inside `useFrame`. Holding the
// focus index in React state and passing it as a prop would re-render the Canvas subtree on every click
// (non-negotiable #4); the rig only needs to READ it per frame. Same pattern as `art-lab/lab-state.ts`
// and `game/spectator.ts`. The sidebar keeps its own `useState` mirror purely to paint the active row —
// that re-render is scoped to the sidebar leaf and never reaches the scene.

export const galleryFocus = {
    /** Index into SUBJECTS, or -1 for the wide "everything" view. */
    index: -1,
};
