import { useFrame } from '@react-three/fiber';
import { PLAIN_RENDER_PRIORITY } from './plain-render.constants';

export function PlainRender() {
    useFrame( ( { gl, scene, camera } ) => {
        gl.render( scene, camera );
    }, PLAIN_RENDER_PRIORITY );

    return null;
}
