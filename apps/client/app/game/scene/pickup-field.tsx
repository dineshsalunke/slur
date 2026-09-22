import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { type Anchor, pickupsOf, type RunState, type Track } from '@slur/shared';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

function placeSlot(
    mesh: THREE.InstancedMesh,
    o: THREE.Object3D,
    layout: Anchor[],
    indexById: Map< string, number >,
    id: string,
    taken: boolean,
): void {
    const i = indexById.get( id );
    if ( i === undefined ) return;
    const p = layout[ i ];
    const s = taken ? 0 : 1;
    o.position.set( p.x, p.y, p.z );
    o.scale.set( s, s, s );
    o.updateMatrix();
    mesh.setMatrixAt( i, o.matrix );
    mesh.instanceMatrix.needsUpdate = true;
}

export function PickupField( { room, track }: { room: Room< RunState >; track: Track } ) {
    const layout = useMemo( () => pickupsOf( track ), [ track ] );
    const indexById = useMemo( () => new Map( layout.map( ( p, i ) => [ p.id, i ] as const ) ), [ layout ] );
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const seededMesh = useRef< THREE.InstancedMesh | null >( null );
    const m = useMemo( () => new THREE.Object3D(), [] );

    const setMesh = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            ref.current = mesh;
            if ( mesh && seededMesh.current !== mesh ) {
                for ( const p of layout ) placeSlot( mesh, m, layout, indexById, p.id, false );
                seededMesh.current = mesh;
            }
        },
        [ layout, indexById, m ],
    );

    // Effect justified: subscribes to the pickupTaken MapSchema, which mutates over the wire outside React
    useEffect( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        const apply = ( id: string, taken: boolean ) => placeSlot( mesh, m, layout, indexById, id, taken );

        const $ = getStateCallbacks( room );
        const onTaken = ( v: boolean, id: string ) => apply( id, v === true );
        const offAdd = $( room.state ).pickupTaken.onAdd( onTaken );
        const offChange = $( room.state ).pickupTaken.onChange( onTaken );
        const offRemove = $( room.state ).pickupTaken.onRemove( ( _v, id ) => apply( id, false ) );
        return () => {
            offAdd();
            offChange();
            offRemove();
        };
    }, [ room, layout, indexById, m ] );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, layout.length ] }>
            <icosahedronGeometry args={ [ 0.9, 0 ] } />
            <meshStandardMaterial emissive="#ffd24a" emissiveIntensity={ 3 } />
        </instancedMesh>
    );
}
