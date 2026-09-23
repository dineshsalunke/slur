import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BOLT_EMISSIVE, BOLT_INTENSITY, boltGeometry, MAX_BOLTS } from '../../game/scene/combat-look';
import { localCombat } from './local-combat';

const _o = new THREE.Object3D();

export function LocalBoltField() {
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const geometry = useMemo( boltGeometry, [] );

    // JUSTIFIED EFFECT — brackets a GPU resource: the bolt geometry is created in useMemo, outside R3F's disposal.
    useEffect( () => () => geometry.dispose(), [ geometry ] );

    useFrame( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        let i = 0;
        for ( const bolt of localCombat.bolts.values() ) {
            if ( i >= MAX_BOLTS ) break;
            _o.position.set( bolt.x, bolt.y, bolt.z );
            _o.updateMatrix();
            mesh.setMatrixAt( i++, _o.matrix );
        }
        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
    } );

    return (
        <instancedMesh
            ref={ ref }
            geometry={ geometry }
            count={ 0 }
            frustumCulled={ false }
            args={ [ undefined, undefined, MAX_BOLTS ] }
        >
            <meshStandardMaterial emissive={ BOLT_EMISSIVE } emissiveIntensity={ BOLT_INTENSITY } />
        </instancedMesh>
    );
}
