import { Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { CELL, HALF_WIDTH } from '@slur/shared';
import { Fragment, memo, type ReactNode } from 'react';
import { FrameTap } from '../dev/frame-tap';
import { GRID_VOID } from '../game/scene/env-config';
import { ScaleReference } from './scale-reference';

const FRAMING = 1.9;
const REF_OFFSET = 0.75;

export const IsoLabCanvas = memo( function IsoLabCanvas( {
    children,
    size,
    bloom,
    grid,
    rig,
}: {
    children: ReactNode;
    size: number;
    bloom: boolean;
    grid: boolean;
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

            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={ 0.08 }
                target={ [ 0, size * 0.35, 0 ] }
                minDistance={ 2 }
                maxDistance={ dist * 6 }
                maxPolarAngle={ Math.PI * 0.495 }
            />

            { bloom ? (
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
            ) : (
                <Fragment />
            ) }
            { import.meta.env.DEV && <FrameTap /> }
        </Canvas>
    );
} );
