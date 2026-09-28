import { useFrame } from '@react-three/fiber';
import { toneExposure, toneMode } from '../tone-mapping';
import { PLAIN_RENDER_PRIORITY } from './plain-render.constants';

export function PlainRender() {
    useFrame( ( { gl, scene, camera } ) => {
        const mode = toneMode();
        if ( gl.toneMapping !== mode ) gl.toneMapping = mode;
        gl.toneMappingExposure = toneExposure();
        gl.render( scene, camera );
    }, PLAIN_RENDER_PRIORITY );

    return null;
}
