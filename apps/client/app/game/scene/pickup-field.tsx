import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { type Anchor, pickupsOf, type RunState, type Track } from '@slur/shared';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Place one slot at its anchor, scaled full (available) or 0 (taken). Shared by the mount-time seeding and
// the live subscription so both write matrices the same way.
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

// Track-placed power-up pickups as one instanced mesh. The layout is a read of the track's materialized
// anchors — identical on every client, and never synced — so positions are fixed at mount and only
// per-slot VISIBILITY changes, driven imperatively from state.pickupTaken. Emissive gold, vs cyan bolts.
export function PickupField( { room, track }: { room: Room< RunState >; track: Track } ) {
    const layout = useMemo( () => pickupsOf( track ), [ track ] ); // networked: same descriptor → same anchors on all clients
    const indexById = useMemo( () => new Map( layout.map( ( p, i ) => [ p.id, i ] as const ) ), [ layout ] );
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const seededMesh = useRef< THREE.InstancedMesh | null >( null ); // which mesh we've seeded (re-seed on a new one)
    const m = useMemo( () => new THREE.Object3D(), [] );

    // Seed every slot at mount via a callback ref, which runs during commit and so beats the first paint —
    // the effect below cannot, and the pickups would draw stacked at the origin for a frame. Positions are a
    // deterministic read of the track anchors, so they are known this early. Re-seed when a new mesh mounts.
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
    // and fires no re-render. Cleanup detaches the callbacks only — the room is owned by the loader, never
    // by this component's lifetime.
    useEffect( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        // Toggle a slot: scale to 0 (hidden) when taken, back to full when available; positions never change.
        const apply = ( id: string, taken: boolean ) => placeSlot( mesh, m, layout, indexById, id, taken );

        const $ = getStateCallbacks( room );
        const onTaken = ( v: boolean, id: string ) => apply( id, v === true ); // present&&true = taken/hidden
        const offAdd = $( room.state ).pickupTaken.onAdd( onTaken ); // fires for any entries already present
        const offChange = $( room.state ).pickupTaken.onChange( onTaken );
        const offRemove = $( room.state ).pickupTaken.onRemove( ( _v, id ) => apply( id, false ) ); // absent = available
        return () => {
            offAdd();
            offChange();
            offRemove();
        };
    }, [ room, layout, indexById, m ] );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, layout.length ] }>
            <icosahedronGeometry args={ [ 0.9, 0 ] } />
            <meshStandardMaterial emissive="#ffd24a" emissiveIntensity={ 3 } toneMapped={ false } />
        </instancedMesh>
    );
}
