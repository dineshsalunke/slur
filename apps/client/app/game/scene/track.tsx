import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';

const SIZE = 400;
const GRID_CELL = 40; // texture-tiling cell (NOT the shared 4u sim CELL) → dense reference lines for the speed cue

// A neon grid drawn once into a CanvasTexture, tiled with RepeatWrapping.
function makeGridTexture(): THREE.Texture {
    const px = 512;
    const canvas = document.createElement( 'canvas' );
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'grid texture: 2d context unavailable' );
    ctx.fillStyle = '#05060a';
    ctx.fillRect( 0, 0, px, px );
    ctx.strokeStyle = '#1e6fff';
    ctx.lineWidth = 6;
    ctx.strokeRect( 0, 0, px, px );
    const tex = new THREE.CanvasTexture( canvas );
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set( SIZE / GRID_CELL, SIZE / GRID_CELL );
    return tex;
}

// 2-plane leapfrog floor (cuberun technique): when a plane falls > SIZE behind the ship, teleport
// it 2*SIZE ahead. Leaf-local, imperative useFrame — no subscription, no re-render.
export function Track() {
    const world = useWorld();
    const a = useRef< THREE.Mesh | null >( null );
    const b = useRef< THREE.Mesh | null >( null );
    const grid = useMemo( makeGridTexture, [] );

    // JUSTIFIED EFFECT — external resource lifetime (a GPU texture we `new`'d in useMemo, not created by
    // R3F from JSX). r3f.md: manually-created resources are ours to dispose, and three does NOT release a
    // material's textures when the material is disposed. Keyed on the texture, not `[]`, so a memo the
    // renderer chose to recompute releases the superseded texture instead of stranding it. No
    // render-derivation, no event, no data-flow involved — purely bracketing an external resource's lifetime.
    useEffect( () => () => grid.dispose(), [ grid ] );

    useFrame( () => {
        const e = world.queryFirst( LocalPlayer, Sim );
        const sim = e?.get( Sim );
        if ( ! sim ) return;
        const z = sim.z;
        for ( const m of [ a.current, b.current ] ) {
            if ( m && z - m.position.z > SIZE ) m.position.z += 2 * SIZE;
        }
    } );

    return (
        <Fragment>
            { [ 0, SIZE ].map( ( z, i ) => (
                <mesh key={ z } ref={ i ? b : a } rotation-x={ -Math.PI / 2 } position={ [ 0, 0, z ] }>
                    <planeGeometry args={ [ SIZE, SIZE ] } />
                    <meshStandardMaterial
                        map={ grid }
                        emissive="#0a2540"
                        emissiveMap={ grid }
                        emissiveIntensity={ 1.4 }
                        toneMapped={ false }
                    />
                </mesh>
            ) ) }
        </Fragment>
    );
}
