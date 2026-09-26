import { useFrame } from '@react-three/fiber';
import type { Anchor } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { PICKUP_REVEAL_S } from '../pickup-pose';
import { advanceLife, buildPool, markUploaded, writeInstance } from './pickup-instances.utils';

export interface PickupPart {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
}

export interface PickupLife {
    gone: Uint8Array;
    parked: Uint8Array;
    since: Float32Array;
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
