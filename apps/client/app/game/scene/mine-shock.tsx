import { useFrame } from '@react-three/fiber';
import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { accent } from './accent';
import { drainMineShocks, type MineShock as Shock } from './mine-shock-events';

const MAX = 16;
const LIFE_S = 0.55;
const BIG_R = DEFAULT_SIM_CONFIG.mineTriggerR * 3;
const SMALL_R = DEFAULT_SIM_CONFIG.mineTriggerR * 1.6;
const BRIGHT = 5;
const LIFT = 0.05;

const _o = new THREE.Object3D();
const _c = new THREE.Color();

interface Ring {
    x: number;
    y: number;
    z: number;
    reach: number;
    age: number;
}

function buildLook() {
    return {
        geometry: new THREE.RingGeometry( 0.86, 1, 64, 1 ).rotateX( -Math.PI / 2 ),
        material: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        } ),
    };
}

function spawn( rings: Ring[], e: Shock ): void {
    if ( rings.length >= MAX ) rings.shift();
    rings.push( { x: e.x, y: e.y, z: e.z, reach: e.big ? BIG_R : SMALL_R, age: 0 } );
}

export function MineShock() {
    const look = useMemo( buildLook, [] );
    const rings = useMemo< Ring[] >( () => [], [] );
    const frame = useMemo( () => ( { mesh: null as THREE.InstancedMesh | null } ), [] );

    // Effect justified: brackets GPU resources built in useMemo, which R3F does not dispose.
    useEffect(
        () => () => {
            look.geometry.dispose();
            look.material.dispose();
        },
        [ look ],
    );

    const setMesh = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.mesh = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );

    useFrame( ( _state, delta ) => {
        const mesh = frame.mesh;
        if ( ! mesh ) return;
        drainMineShocks( ( e ) => spawn( rings, e ) );
        let n = 0;
        for ( const r of rings ) {
            r.age += delta;
            if ( r.age >= LIFE_S ) continue;
            const f = r.age / LIFE_S;
            const ease = 1 - ( 1 - f ) * ( 1 - f );
            _o.position.set( r.x, r.y + LIFT, r.z );
            _o.scale.setScalar( Math.max( 0.01, r.reach * ease ) );
            _o.updateMatrix();
            mesh.setMatrixAt( n, _o.matrix );
            mesh.setColorAt( n, _c.copy( accent() ).multiplyScalar( BRIGHT * ( 1 - f ) * ( 1 - f ) ) );
            n++;
        }
        while ( rings.length > 0 && rings[ 0 ].age >= LIFE_S ) rings.shift();
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
        if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
    } );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            renderOrder={ 2 }
            args={ [ look.geometry, look.material, MAX ] }
        />
    );
}
