import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { BACKDROP_ORDER, BACKDROP_URL } from './scene-backdrop.constants';
import { backdropUniforms, coverFit, prepareBackdrop } from './scene-backdrop.utils';

export function SceneBackdrop() {
    const aspect = useThree( ( state ) => state.size.width / state.size.height );
    const map = useTexture( BACKDROP_URL );
    const uniforms = useMemo( () => backdropUniforms( map ), [ map ] );

    prepareBackdrop( map );
    coverFit( map, aspect );

    return (
        <mesh frustumCulled={ false } renderOrder={ BACKDROP_ORDER }>
            <planeGeometry args={ [ 2, 2 ] } />
            <shaderMaterial
                name="BackdropMaterial"
                uniforms={ uniforms }
                vertexShader={ THREE.ShaderLib.background.vertexShader }
                fragmentShader={ THREE.ShaderLib.background.fragmentShader }
                depthTest={ false }
                depthWrite={ false }
            />
        </mesh>
    );
}
