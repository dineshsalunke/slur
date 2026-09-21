import { Grid } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { WorldProvider } from 'koota/react';
import { Suspense } from 'react';
import { world } from '../../game/ecs/world';
import { ENV_VARIANTS } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { LandingRig } from './landing-rig';
import { LandingShip } from './landing-ship';

const GRID_VOID = ENV_VARIANTS[ 2 ];
const BACKDROP_SEED = 0x5107;

export function LandingScene() {
    return (
        <WorldProvider world={ world }>
            <Canvas
                style={ { position: 'fixed', inset: 0, zIndex: 0 } }
                camera={ { fov: 75, position: [ 0, 5, -13 ] } }
            >
                <ambientLight intensity={ 0.4 } />
                <directionalLight position={ [ 4, 10, 6 ] } intensity={ 1.3 } />
                <LandingRig />
                <Suspense fallback={ null }>
                    <LandingShip />
                </Suspense>
                <Grid
                    infiniteGrid
                    followCamera
                    cellSize={ 4 }
                    cellThickness={ 0.6 }
                    cellColor="#0e3a4a"
                    sectionSize={ 20 }
                    sectionThickness={ 1.1 }
                    sectionColor="#1fa8c8"
                    fadeDistance={ 300 }
                    fadeStrength={ 6 }
                />
                <Environment config={ GRID_VOID } />
                <EffectComposer multisampling={ 0 }>
                    <Bloom
                        mipmapBlur
                        intensity={ GRID_VOID.bloom.intensity }
                        luminanceThreshold={ GRID_VOID.bloom.threshold }
                        luminanceSmoothing={ GRID_VOID.bloom.smoothing }
                        radius={ GRID_VOID.bloom.radius }
                        levels={ GRID_VOID.bloom.levels }
                    />
                </EffectComposer>
            </Canvas>
        </WorldProvider>
    );
}
