import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export function SceneProbe() {
    const scene = useThree( ( s ) => s.scene );
    const camera = useThree( ( s ) => s.camera );
    const gl = useThree( ( s ) => s.gl );

    // JUSTIFIED EFFECT — publishes a handle to an external system (the devtools console). No render
    useEffect( () => {
        const w = window as unknown as { __ART_LAB?: unknown };
        w.__ART_LAB = { scene, camera, gl };
        return () => {
            delete w.__ART_LAB;
        };
    }, [ scene, camera, gl ] );

    return null;
}
