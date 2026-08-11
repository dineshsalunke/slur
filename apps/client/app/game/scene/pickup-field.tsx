import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { type Anchor, pickupsOf, type RunState, type Track } from '@slur/shared';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Place one slot at its fixed anchor position, scaled full (available) or 0 (taken). Positions never change —
// only per-slot VISIBILITY toggles. Shared by the mount-time seeding (callback ref) and the live subscription
// (effect) so both write matrices the same way.
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
    const seededMesh = useRef< THREE.InstancedMesh | null >( null ); // which mesh we've seeded (re-seed on a new one)
    const m = useMemo( () => new THREE.Object3D(), [] );

    // Seed every slot at its anchor position AT MOUNT (callback ref → fires during commit, BEFORE the first
    // paint). The buffer is created with layout.length identity matrices, so without this the pickups draw
    // stacked at the origin for one frame until the effect below runs — but the effect runs AFTER the first
    // paint, so it cannot prevent frame-1 (#53). Positions are known at mount (a deterministic read of the
    // track anchors), so we place them here; the effect keeps only the live availability subscription. Re-seed
    // when a NEW mesh mounts (a track/layout change re-creates the instancedMesh via its `args`). Not a mount
    // EFFECT — just imperative init, matching explosions.tsx / hit-spark.tsx.
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

    // JUSTIFIED EFFECT — syncs with an external system: the pickupTaken MapSchema (Colyseus, NOT React-reactive)
    // → per-instance visibility. The map mutates over the wire outside React and fires no re-render.
    //  1) render-derivation? no — availability arrives as schema deltas; nothing to derive from props/render.
    //  2) event handler? no DOM/user event — these are network callbacks the effect registers.
    //  3) loader/action data? no — a live per-patch stream; the loader OWNS the room, this only SUBSCRIBES.
    //  4) ref/module singleton? the room is loader/singleton-owned (read via prop); only the callbacks + the
    //     instanced-mesh ref need a mount-scoped lifetime. 5) external sync? YES — schema callbacks → matrices.
    //  VERDICT: keep. Cleanup detaches the callbacks; it never touches the connection. Initial visible seeding
    //  moved to the callback ref above (frame-1 safety); this effect now toggles availability only.
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
