import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { pickupsOf, type RunState, type Track } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Track-placed power-up pickups: a deterministic archetype rendered as ONE instanced mesh. The layout is a
// READ of the track's provider-materialized `anchors` (ADR-002 — kind 'pickup'; identical on every client,
// geometry is NEVER synced), so positions are fixed at mount; only per-slot VISIBILITY changes, driven
// imperatively from state.pickupTaken. Distinct emissive gold vs the cyan bolts. No useFrame + no React
// re-render — visibility toggles in a subscription callback (r3f.md: bridge the not-reactive MapSchema
// through refs, never in render).
export function PickupField( { room, track }: { room: Room< RunState >; track: Track } ) {
    const layout = useMemo( () => pickupsOf( track ), [ track ] ); // networked: same descriptor → same anchors on all clients
    const indexById = useMemo( () => new Map( layout.map( ( p, i ) => [ p.id, i ] as const ) ), [ layout ] );
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const m = useMemo( () => new THREE.Object3D(), [] );

    // JUSTIFIED EFFECT — syncs with an external system: the pickupTaken MapSchema (Colyseus, NOT React-reactive)
    // → per-instance visibility. The map mutates over the wire outside React and fires no re-render.
    //  1) render-derivation? no — availability arrives as schema deltas; nothing to derive from props/render.
    //  2) event handler? no DOM/user event — these are network callbacks the effect registers.
    //  3) loader/action data? no — a live per-patch stream; the loader OWNS the room, this only SUBSCRIBES.
    //  4) ref/module singleton? the room is loader/singleton-owned (read via prop); only the callbacks + the
    //     instanced-mesh ref need a mount-scoped lifetime. 5) external sync? YES — schema callbacks → matrices.
    //  VERDICT: keep. Cleanup detaches the callbacks; it never touches the connection.
    useEffect( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        // Scale a slot to 0 (hidden) when taken, back to full when available; positions never change.
        const apply = ( id: string, taken: boolean ) => {
            const i = indexById.get( id );
            if ( i === undefined ) return;
            const p = layout[ i ];
            const s = taken ? 0 : 1;
            m.position.set( p.x, p.y, p.z );
            m.scale.set( s, s, s );
            m.updateMatrix();
            mesh.setMatrixAt( i, m.matrix );
            mesh.instanceMatrix.needsUpdate = true;
        };
        for ( const p of layout ) apply( p.id, false ); // seed all visible; taken slots hide via the callbacks below

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
        <instancedMesh ref={ ref } frustumCulled={ false } args={ [ undefined, undefined, layout.length ] }>
            <icosahedronGeometry args={ [ 0.9, 0 ] } />
            <meshStandardMaterial emissive="#ffd24a" emissiveIntensity={ 3 } toneMapped={ false } />
        </instancedMesh>
    );
}
