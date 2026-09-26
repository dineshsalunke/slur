import { Hud, OrthographicCamera, useFBO } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { useRebuildToken } from '../../dev/use-rebuild-token';
import { updateRearCamera } from './rear-view-camera';
import { REAR_ASPECT, REAR_PANEL_HEIGHT, REAR_PANEL_WIDTH } from './rear-view-frame';
import { RearViewPanel } from './rear-view-panel';
import { rearViewSurface } from './rear-view-surface';

const REAR_NEAR = 1;
const REAR_FAR = 1000;
const REAR_SAMPLES = 4;

const PASS_PRIORITY = 0.5;
const HUD_PRIORITY = 2;

export function RearViewPass() {
    const world = useWorld();
    const dpr = useThree( ( state ) => state.viewport.dpr );

    useRebuildToken();
    const scale = num( 'RearView.scale' );
    const width = REAR_PANEL_WIDTH * scale;
    const height = REAR_PANEL_HEIGHT * scale;

    const target = useFBO( Math.round( width * dpr ), Math.round( height * dpr ), { samples: REAR_SAMPLES } );
    const camera = useMemo( () => new THREE.PerspectiveCamera( 0, REAR_ASPECT, REAR_NEAR, REAR_FAR ), [] );
    const surface = useMemo( () => rearViewSurface( target.texture ), [ target ] );

    useFrame( ( state ) => {
        if ( ! updateRearCamera( camera, world ) ) return;
        const uniforms = surface.uniforms;
        uniforms.uExposure.value = state.gl.toneMappingExposure;
        uniforms.uGain.value = num( 'RearView.gain' );
        uniforms.uSize.value.set( width, height );
        state.gl.setRenderTarget( target );
        state.gl.clear( true, true, true );
        state.gl.render( state.scene, camera );
        state.gl.setRenderTarget( null );
    }, PASS_PRIORITY );

    return (
        <Hud renderPriority={ HUD_PRIORITY }>
            <OrthographicCamera makeDefault position={ [ 0, 0, 10 ] } />
            <RearViewPanel surface={ surface } width={ width } height={ height } />
        </Hud>
    );
}
