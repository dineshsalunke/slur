import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { accent } from '../accent';
import { drainMineShocks, type MineShock as Shock } from '../mine-shock-events';
import { _c, _o, LIFT, MAX } from './mine-shock.constants';
import { buildLook, spawn, spread } from './mine-shock.utils';

export interface ShockLook {
    reach: number;
    life: number;
    bright: number;
    collapse: boolean;
}

export interface Ring {
    x: number;
    y: number;
    z: number;
    look: ShockLook;
    age: number;
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
