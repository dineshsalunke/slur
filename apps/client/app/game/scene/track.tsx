import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';

const SIZE = 400;
const GRID_CELL = 40;

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

export function Track() {
    const world = useWorld();
    const a = useRef< THREE.Mesh | null >( null );
    const b = useRef< THREE.Mesh | null >( null );
    const grid = useMemo( makeGridTexture, [] );

    // JUSTIFIED EFFECT — external resource lifetime (a GPU texture we `new`'d in useMemo, not created by
    useEffect( () => () => grid.dispose(), [ grid ] );

    useFrame( () => {
        const e = world.queryFirst( LocalPlayer, Sim );
        const sim = e?.get( Sim );
        if ( ! sim ) return;
        const z = sim.z;
        if ( a.current && z - a.current.position.z > SIZE ) a.current.position.z += 2 * SIZE;
        if ( b.current && z - b.current.position.z > SIZE ) b.current.position.z += 2 * SIZE;
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
                    />
                </mesh>
            ) ) }
        </Fragment>
    );
}
