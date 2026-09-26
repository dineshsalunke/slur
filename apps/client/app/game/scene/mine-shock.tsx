import { useFrame } from '@react-three/fiber';
import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { accent } from './accent';
import { drainMineShocks, type MineShock as Shock, type ShockKind } from './mine-shock-events';

const MAX = 16;
const LIFT = 0.05;

interface ShockLook {
    reach: number;
    life: number;
    bright: number;
    collapse: boolean;
}

const LOOKS: Record< ShockKind, ShockLook > = {
    big: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 3, life: 0.55, bright: 5, collapse: false },
    small: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 1.6, life: 0.55, bright: 5, collapse: false },
    fizzle: { reach: DEFAULT_SIM_CONFIG.mineTriggerR * 1.6, life: 0.4, bright: 5, collapse: true },
};

const _o = new THREE.Object3D();
const _c = new THREE.Color();

interface Ring {
    x: number;
    y: number;
    z: number;
    look: ShockLook;
    age: number;
}

function buildLook() {
    return {
        geometry: new THREE.RingGeometry( 0.86, 1, 64, 1 ).rotateX( -Math.PI / 2 ),
        material: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        } ),
    };
}

function spawn( rings: Ring[], e: Shock ): void {
    if ( rings.length >= MAX ) rings.shift();
    rings.push( { x: e.x, y: e.y, z: e.z, look: LOOKS[ e.kind ], age: 0 } );
}

function spread( r: Ring, f: number ): number {
    const ease = 1 - ( 1 - f ) * ( 1 - f );
    return r.look.reach * ( r.look.collapse ? 1 - ease : ease );
}

export function MineShock() {
    const look = useMemo( buildLook, [] );
    const rings = useMemo< Ring[] >( () => [], [] );
    const frame = useMemo( () => ( { mesh: null as THREE.InstancedMesh | null } ), [] );
    const onShock = useMemo( () => ( e: Shock ) => spawn( rings, e ), [ rings ] );

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
        drainMineShocks( onShock );
        let n = 0;
        for ( const r of rings ) {
            r.age += delta;
            if ( r.age >= r.look.life ) continue;
            const f = r.age / r.look.life;
            _o.position.set( r.x, r.y + LIFT, r.z );
            _o.scale.setScalar( Math.max( 0.01, spread( r, f ) ) );
            _o.updateMatrix();
            mesh.setMatrixAt( n, _o.matrix );
            mesh.setColorAt( n, _c.copy( accent() ).multiplyScalar( r.look.bright * ( 1 - f ) * ( 1 - f ) ) );
            n++;
        }
        while ( rings.length > 0 && rings[ 0 ].age >= rings[ 0 ].look.life ) rings.shift();
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
