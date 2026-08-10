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

// Grid Void is variant C (dense stars, cyan haze + horizon-glow dome, mid cyan canyon walls) — the calm,
// on-brand backdrop for the front-of-house. A fixed backdrop seed keeps the skyline stable across mounts.
const GRID_VOID = ENV_VARIANTS[ 2 ];
const BACKDROP_SEED = 0x5107;

// The ambient landing backdrop: the parameterised Grid-Void Environment under a slow, camera-only drift
// (LandingRig), rendered into a position:fixed Canvas that the front-of-house UI overlays. A single hero
// ship (cosmetic, LandingShip) flies ahead over an infinite neon Grid floor so the menu reads as "the game
// in motion" — still cheap (no Track ribbon, no net loop, no collision). Follows the env-lab canvas pattern
// (WorldProvider + single global Bloom), isolated from net-canvas.
export function LandingScene() {
    return (
        <WorldProvider world={ world }>
            <Canvas
                style={ { position: 'fixed', inset: 0, zIndex: 0 } }
                camera={ { fov: 75, position: [ 0, 5, -13 ] } }
            >
                <ambientLight intensity={ 0.4 } />
                { /* A key light so the hero ship's hull catches a highlight (non-emissive GLTF needs real
                     light; ambient alone reads flat). Direction-only — its z position is irrelevant. */ }
                <directionalLight position={ [ 4, 10, 6 ] } intensity={ 1.3 } />
                <LandingRig />
                <Suspense fallback={ null }>
                    <LandingShip />
                </Suspense>
                { /* Infinite TRON floor grid: dim cyan cells, brighter cyan section lines, faded well before
                     the fog wall so it melts into the haze. followCamera keeps it underfoot as we drift. */ }
                <Grid
                    infiniteGrid
                    followCamera
                    cellSize={ 4 }
                    cellThickness={ 0.6 }
                    cellColor="#0e3a4a"
                    sectionSize={ 20 }
                    sectionThickness={ 1.1 }
                    sectionColor="#1fa8c8"
                    fadeDistance={ 130 }
                    fadeStrength={ 3 }
                />
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
