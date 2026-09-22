import { Hud, OrthographicCamera, useFBO } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import * as THREE from 'three';
import { updateRearCamera } from './rear-view-camera';
import { REAR_ASPECT, REAR_TEXTURE_HEIGHT, REAR_TEXTURE_WIDTH } from './rear-view-frame';
import { RearViewPanel } from './rear-view-panel';

const REAR_NEAR = 1;
const REAR_FAR = 1000;

const PASS_PRIORITY = 0.5;
const HUD_PRIORITY = 2;

export function RearView() {
    const world = useWorld();
    const target = useFBO( REAR_TEXTURE_WIDTH, REAR_TEXTURE_HEIGHT );
    const camera = useMemo( () => new THREE.PerspectiveCamera( 0, REAR_ASPECT, REAR_NEAR, REAR_FAR ), [] );

    const map = useMemo( () => {
        const texture = target.texture;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.repeat.x = -1;
        texture.offset.x = 1;
        return texture;
    }, [ target ] );

    useFrame( ( state ) => {
        if ( ! updateRearCamera( camera, world ) ) return;
        state.gl.setRenderTarget( target );
        state.gl.render( state.scene, camera );
        state.gl.setRenderTarget( null );
    }, PASS_PRIORITY );

    return (
        <Hud renderPriority={ HUD_PRIORITY }>
            <OrthographicCamera makeDefault position={ [ 0, 0, 10 ] } />
            <RearViewPanel map={ map } />
        </Hud>
    );
}
