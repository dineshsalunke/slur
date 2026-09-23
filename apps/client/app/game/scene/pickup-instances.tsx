import { useFrame } from '@react-three/fiber';
import type { Anchor } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PICKUP_BOB, PICKUP_BOB_HZ, PICKUP_HOVER, PICKUP_POOL_RADIUS, PICKUP_SPIN } from './combat-look';
import { buildPickupPoolMaterial } from './pickup-pool-material';
import { PICKUP_REVEAL_S, type PickupPose, pickupPose } from './pickup-pose';

export interface PickupPart {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
}

const _o = new THREE.Object3D();
const _pool = new THREE.Object3D();
const _pose: PickupPose = { scale: 1, lift: 0, spin: 0 };
const TAU = Math.PI * 2;

function buildPool(): PickupPart {
    return {
        geometry: new THREE.PlaneGeometry( PICKUP_POOL_RADIUS * 2, PICKUP_POOL_RADIUS * 2 ).rotateX( -Math.PI / 2 ),
        material: buildPickupPoolMaterial(),
    };
}

interface PickupLife {
    gone: Uint8Array;
    parked: Uint8Array;
    since: Float32Array;
}

function advanceLife( life: PickupLife, i: number, taken: boolean, delta: number ): boolean {
    const gone = taken ? 1 : 0;
    if ( gone !== life.gone[ i ] ) {
        life.gone[ i ] = gone;
        life.since[ i ] = 0;
        life.parked[ i ] = 0;
        return true;
    }
    if ( life.parked[ i ] === 1 ) return false;
    life.since[ i ] += delta;
    return true;
}

function writeInstance(
    parts: readonly ( THREE.InstancedMesh | null )[],
    pool: THREE.InstancedMesh,
    i: number,
    p: Anchor,
    life: PickupLife,
    t: number,
): void {
    const gone = life.gone[ i ] === 1;
    const { scale: s, lift, spin } = pickupPose( gone, life.since[ i ], _pose );
    if ( gone && s === 0 ) life.parked[ i ] = 1;
    const phase = i * 1.7;
    const bob = Math.sin( t * PICKUP_BOB_HZ * TAU + phase ) * PICKUP_BOB;
    _o.position.set( p.x, p.y + PICKUP_HOVER + bob + lift, p.z );
    _o.rotation.set( 0, t * PICKUP_SPIN + phase + spin, 0 );
    _o.scale.setScalar( s );
    _o.updateMatrix();
    for ( const m of parts ) m?.setMatrixAt( i, _o.matrix );
    _pool.position.set( p.x, p.y + 0.03, p.z );
    _pool.scale.setScalar( s );
    _pool.updateMatrix();
    pool.setMatrixAt( i, _pool.matrix );
}

function markUploaded( parts: readonly ( THREE.InstancedMesh | null )[], pool: THREE.InstancedMesh ): void {
    for ( const m of parts ) if ( m ) m.instanceMatrix.needsUpdate = true;
    pool.instanceMatrix.needsUpdate = true;
}

export function PickupInstances( {
    layout,
    isTaken,
    buildBody,
}: {
    layout: Anchor[];
    isTaken: ( id: string ) => boolean;
    buildBody: () => PickupPart[];
} ) {
    const body = useMemo( buildBody, [ buildBody ] );
    const pool = useMemo( buildPool, [] );
    const life = useMemo(
        () => ( {
            gone: new Uint8Array( layout.length ),
            parked: new Uint8Array( layout.length ),
            since: new Float32Array( layout.length ).fill( PICKUP_REVEAL_S ),
        } ),
        [ layout ],
    );
    const meshes = useRef< ( THREE.InstancedMesh | null )[] >( [] );
    const poolMesh = useRef< THREE.InstancedMesh | null >( null );

    // Effect justified: brackets GPU resources built in useMemo, which R3F does not dispose.
    useEffect(
        () => () => {
            for ( const part of [ ...body, pool ] ) {
                part.geometry.dispose();
                part.material.dispose();
            }
        },
        [ body, pool ],
    );

    useFrame( ( state, delta ) => {
        const d = poolMesh.current;
        const parts = meshes.current;
        if ( ! d ) return;
        const t = state.clock.elapsedTime;
        for ( let i = 0; i < layout.length; i++ ) {
            const p = layout[ i ];
            if ( ! advanceLife( life, i, isTaken( p.id ), delta ) ) continue;
            writeInstance( parts, d, i, p, life, t );
        }
        markUploaded( parts, d );
    } );

    return (
        <group>
            { body.map( ( part, i ) => (
                <instancedMesh
                    key={ part.geometry.uuid }
                    ref={ ( m ) => {
                        meshes.current[ i ] = m;
                    } }
                    frustumCulled={ false }
                    args={ [ part.geometry, part.material, layout.length ] }
                />
            ) ) }
            <instancedMesh
                ref={ poolMesh }
                frustumCulled={ false }
                renderOrder={ 1 }
                args={ [ pool.geometry, pool.material, layout.length ] }
            />
        </group>
    );
}
