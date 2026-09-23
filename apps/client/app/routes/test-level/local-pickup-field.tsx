import { useFrame } from '@react-three/fiber';
import { pickupsOf, type Track } from '@slur/shared';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PICKUP_EMISSIVE, PICKUP_INTENSITY, PICKUP_RADIUS } from '../../game/scene/combat-look';
import { localCombat } from './local-combat';

const _o = new THREE.Object3D();

export function LocalPickupField( { track }: { track: Track } ) {
    const layout = useMemo( () => pickupsOf( track ), [ track ] );
    const ref = useRef< THREE.InstancedMesh | null >( null );

    useFrame( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        for ( let i = 0; i < layout.length; i++ ) {
            const p = layout[ i ];
            const s = localCombat.taken.get( p.id ) ? 0 : 1;
            _o.position.set( p.x, p.y, p.z );
            _o.scale.set( s, s, s );
            _o.updateMatrix();
            mesh.setMatrixAt( i, _o.matrix );
        }
        mesh.instanceMatrix.needsUpdate = true;
    } );

    return (
        <instancedMesh ref={ ref } frustumCulled={ false } args={ [ undefined, undefined, layout.length ] }>
            <icosahedronGeometry args={ [ PICKUP_RADIUS, 0 ] } />
            <meshStandardMaterial emissive={ PICKUP_EMISSIVE } emissiveIntensity={ PICKUP_INTENSITY } />
        </instancedMesh>
    );
}
