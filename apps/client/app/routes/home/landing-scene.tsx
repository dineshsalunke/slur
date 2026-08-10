import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { WorldProvider } from 'koota/react';
import { world } from '../../game/ecs/world';
import { ENV_VARIANTS } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { LandingRig } from './landing-rig';

// Grid Void is variant C (dense stars, cyan haze + horizon-glow dome, mid cyan canyon walls) — the calm,
// on-brand backdrop for the front-of-house. A fixed backdrop seed keeps the skyline stable across mounts.
const GRID_VOID = ENV_VARIANTS[ 2 ];
const BACKDROP_SEED = 0x5107;

// The ambient landing backdrop: the parameterised Grid-Void Environment under a slow, camera-only drift
// (LandingRig), rendered into a position:fixed Canvas that the front-of-house UI overlays. Menu-cheap on
// purpose — no Track ribbon, no ships, no net loop; just sky + drifting neon walls behind the glass panels.
// Follows the env-lab canvas pattern (WorldProvider + single global Bloom), isolated from net-canvas.
export function LandingScene() {
    return (
        <WorldProvider world={ world }>
            <Canvas
                style={ { position: 'fixed', inset: 0, zIndex: 0 } }
                camera={ { fov: 75, position: [ 0, 5, -13 ] } }
            >
                <ambientLight intensity={ 0.4 } />
                <LandingRig />
                <Environment config={ GRID_VOID } seed={ BACKDROP_SEED } />
                <EffectComposer multisampling={ 0 }>
                    <Bloom
                        mipmapBlur
                        intensity={ GRID_VOID.bloom.intensity }
                        luminanceThreshold={ GRID_VOID.bloom.threshold }
                        luminanceSmoothing={ GRID_VOID.bloom.smoothing }
                    />
                </EffectComposer>
            </Canvas>
        </WorldProvider>
    );
}
