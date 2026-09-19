import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * TEMPORARY DEBUG INSTRUMENT — DELETE, DO NOT EVOLVE.
 *
 * Publishes the R3F state on `window.__ART_LAB` so the scene graph can be dumped from the console while
 * diagnosing the dark sphere that occludes the sky at the slice-0 gate. Nothing in the lab reads it.
 * Via `useThree` rather than three's `__THREE_DEVTOOLS__` hook, which has to be installed before the
 * renderer is constructed — and this also works in a tab whose rAF is dead, where no render ever fires.
 */
export function SceneProbe() {
    const scene = useThree( ( s ) => s.scene );
    const camera = useThree( ( s ) => s.camera );
    const gl = useThree( ( s ) => s.gl );

    // JUSTIFIED EFFECT — publishes a handle to an external system (the devtools console). No render
    // derivation, no event, no data flow; cleanup stops a stale scene outliving the Canvas.
    useEffect( () => {
        const w = window as unknown as { __ART_LAB?: unknown };
        w.__ART_LAB = { scene, camera, gl };
        return () => {
            delete w.__ART_LAB;
        };
    }, [ scene, camera, gl ] );

    return null;
}
