import { Grid } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Fragment } from 'react';
import { GRID_VOID } from '../../game/scene/env-config';
import { GalleryCamera } from './gallery-camera';
import { GallerySubject } from './gallery-subject';
import { SUBJECTS, slotFor } from './subjects';

/**
 * The gallery's WebGL half: every subject laid out on a world-space grid under ONE camera and ONE
 * EffectComposer.
 *
 * WHY NOT drei `<View>`: `View` is the purpose-built multi-viewport primitive and it IS available in the
 * installed drei (10.7.8). It was rejected deliberately — it renders each viewport through scissor into a
 * separate DOM rect, which does not coexist with a single global `EffectComposer` pass. Matching the game's
 * post-processing EXACTLY is the whole value of this route; a gallery lit differently from the game cannot
 * settle an art question. A shared world-space grid keeps one bloom pass over everything, at the cost of a
 * shared perspective — which is an acceptable trade, and arguably useful, since off-axis subjects are seen
 * at the same kind of angles they appear at in play.
 */
export function ArtGalleryCanvas( { bloom, showGrid }: { bloom: boolean; showGrid: boolean } ) {
    return (
        <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 50, position: [ 0, 60, -130 ] } }>
            <color attach="background" args={ [ '#05060a' ] } />
            <ambientLight intensity={ 0.5 } />
            <directionalLight position={ [ 30, 60, -40 ] } intensity={ 0.8 } />

            <GalleryCamera />

            { SUBJECTS.map( ( s, i ) => (
                <GallerySubject key={ s.id } subject={ s } position={ slotFor( i ) } />
            ) ) }

            { /* A 1-unit grid so world scale is readable at a glance: every cell is 1u, every heavy line 10u. */ }
            { showGrid ? (
                <Grid
                    args={ [ 400, 400 ] }
                    cellSize={ 1 }
                    cellThickness={ 0.5 }
                    cellColor="#1b2530"
                    sectionSize={ 10 }
                    sectionThickness={ 1 }
                    sectionColor="#2d4256"
                    fadeDistance={ 400 }
                    fadeStrength={ 1 }
                    infiniteGrid
                    position={ [ 0, -0.05, 0 ] }
                />
            ) : (
                <Fragment />
            ) }

            { /* No OrbitControls: it and GalleryCamera would both drive the camera every frame and fight.
                 Framing is driven from the sidebar instead — click a subject to fly to it, "wide" to pull
                 back. Deterministic framing is also what makes two screenshots comparable, which free-orbit
                 inspection is not. */ }

            { /* Same bloom config the game pins (GRID_VOID), so what you judge here is what ships. Toggling it
                 off is a first-class review mode: the handoff requires readability to survive without bloom. */ }
            { bloom ? (
                <EffectComposer multisampling={ 0 }>
                    <Bloom
                        mipmapBlur
                        intensity={ GRID_VOID.bloom.intensity }
                        luminanceThreshold={ GRID_VOID.bloom.threshold }
                        luminanceSmoothing={ GRID_VOID.bloom.smoothing }
                    />
                </EffectComposer>
            ) : (
                <Fragment />
            ) }
        </Canvas>
    );
}
