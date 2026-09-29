import { useFrame } from '@react-three/fiber';
import { FRAME_PHASE } from '../../frame/frame-phase.constants';
import { toneExposure, toneMode } from '../tone-mapping';

export function PlainRender() {
    useFrame( ( { gl, scene, camera } ) => {
        const mode = toneMode();
        if ( gl.toneMapping !== mode ) gl.toneMapping = mode;
        gl.toneMappingExposure = toneExposure();
        gl.render( scene, camera );
    }, FRAME_PHASE.render );

    return null;
}
