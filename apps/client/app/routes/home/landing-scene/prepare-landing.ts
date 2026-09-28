import type { RootState } from '@react-three/fiber';
import { prepareRenderer } from '../../../game/scene/canvas-gl';
import { dropBackdrop3d } from '../../../quality/quality.state';

export function prepareLanding( state: RootState ): void {
    prepareRenderer( state );
    state.gl.domElement.addEventListener( 'webglcontextlost', dropBackdrop3d, { once: true } );
}
