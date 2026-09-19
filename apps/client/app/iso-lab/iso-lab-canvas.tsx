import { Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { CELL, HALF_WIDTH } from '@slur/shared';
import { Fragment, memo, type ReactNode } from 'react';
import { GRID_VOID } from '../game/scene/env-config';
import { ScaleReference } from './scale-reference';

/** How far back the camera starts, as a multiple of the subject's declared size. */
const FRAMING = 1.9;
/** Where the scale reference stands, as a multiple of the subject's declared size, so it never intersects. */
const REF_OFFSET = 0.75;

/**
 * The WebGL half of an isolation lab: ONE subject, the game's real void, the game's real bloom.
 *
 * It imports `GRID_VOID` rather than declaring its own background/bloom numbers. That is the whole point —
 * a lab that lies about the game is worse than no lab, and the only defence that survives a retune is to
 * consume the same object the game consumes, so divergence is impossible by construction rather than by
 * discipline. (Same reason `/art-gallery` spreads `track-materials.ts`.)
 *
 * WHY `memo`: the controls (overlay mode, opacity, board) live in the DOM sibling and change on every slider
 * drag. Without memo each drag would reconcile the entire R3F subtree. The `children` element identity is
 * stable across those re-renders (it comes from the route's render, not the lab's), so memo genuinely bails
 * out. Non-negotiable #4, applied to a control panel rather than a frame loop.
 */
export const IsoLabCanvas = memo( function IsoLabCanvas( {
    children,
    size,
    bloom,
    grid,
    rig,
}: {
    children: ReactNode;
    /** The subject's largest world dimension — drives camera distance and ruler height. Nothing is scaled. */
    size: number;
    bloom: boolean;
    grid: boolean;
    /** The neutral ambient+directional pair and the scale ruler. Off for an ingredient that IS the lighting. */
    rig: boolean;
} ) {
    const dist = Math.max( 12, size * FRAMING );

    return (
        <Canvas
            style={ { position: 'absolute', inset: 0 } }
            camera={ {
                fov: 45,
                near: 0.5,
                far: Math.max( 4000, dist * 12 ),
                position: [ dist * 0.6, dist * 0.45, dist ],
            } }
        >
            <color attach="background" args={ [ GRID_VOID.background ] } />

            { /* Deliberately NOT the game's fog: at 300u a monolith would sit inside GRID_VOID's 460u far
                 plane and be judged half-dissolved. Atmosphere is `/art-lab`'s question; this route answers
                 "what is this object". Lighting stays neutral and matches `/art-gallery` so the two agree.

                 Suppressible via `rig`, because ONE ingredient — the sky — is itself the lighting, and a
                 neutral directional light there would light a roughness probe all on its own and quietly make
                 the environment self-test pass whether or not the environment works. The ruler goes with it:
                 it is an emissive cyan bar, which is exactly what a cold sky must not be judged against. */ }
            { rig ? (
                <Fragment>
                    <ambientLight intensity={ 0.5 } />
                    <directionalLight position={ [ dist, dist * 1.6, -dist ] } intensity={ 0.8 } />
                </Fragment>
            ) : (
                <Fragment />
            ) }

            { children }

            { rig ? <ScaleReference height={ size } offsetX={ -size * REF_OFFSET } /> : <Fragment /> }

            { /* True-scale ground grid: one cell = CELL (4u, the AUTHORING snap grid — never a runtime unit,
                 GDD §0), one heavy section = 64u = ONE FULL TRACK WIDTH. So "how many heavy squares wide is
                 this thing" reads directly as "how many track widths". */ }
            { grid ? (
                <Grid
                    args={ [ 10, 10 ] }
                    cellSize={ CELL }
                    cellThickness={ 0.5 }
                    cellColor="#1b2530"
                    sectionSize={ HALF_WIDTH * 2 }
                    sectionThickness={ 1.2 }
                    sectionColor="#2d4256"
                    fadeDistance={ dist * 6 }
                    fadeStrength={ 1 }
                    infiniteGrid
                    position={ [ 0, -0.02, 0 ] }
                />
            ) : (
                <Fragment />
            ) }

            { /* Free orbit, unlike `/art-gallery`'s scripted rig. The gallery optimises for two comparable
                 screenshots; a lab optimises for "get your eye to the angle the board was drawn from", which
                 is exactly what a scripted rig cannot do. `makeDefault` so any drei helper added later by an
                 ingredient lane picks these up as the scene controls instead of fighting them. */ }
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={ 0.08 }
                target={ [ 0, size * 0.35, 0 ] }
                minDistance={ 2 }
                maxDistance={ dist * 6 }
                maxPolarAngle={ Math.PI * 0.495 }
            />

            { /* The shipped bloom config (GRID_VOID), so what you judge here is what ships. Toggling it off
                 is a first-class review mode: the handoff requires readability to survive without bloom. */ }
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
} );
