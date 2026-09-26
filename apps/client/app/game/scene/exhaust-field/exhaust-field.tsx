import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Net, Render } from '../../ecs/traits';
import { buildExhaustGeometry } from '../exhaust-geometry';
import { buildExhaustMaterial } from '../exhaust-material';
import { PORT_HEIGHT, PORT_WIDTH } from '../exhaust-ports';
import { AFTER_RENDER_SYNC, MAX_PLUMES } from './exhaust-field.constants';
import { syncPalette, writeShip } from './exhaust-field.utils';

export interface Palette {
    hot: string;
    cool: string;
}

export function ExhaustField() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const applied = useRef< Palette >( { hot: '', cool: '' } );

    const geometry = useMemo( () => buildExhaustGeometry( PORT_WIDTH, PORT_HEIGHT ), [] );
    const material = useMemo( buildExhaustMaterial, [] );
    const drive = useMemo( () => new THREE.InstancedBufferAttribute( new Float32Array( MAX_PLUMES * 3 ), 3 ), [] );

    // Effect justified: brackets a GPU resource's lifetime — geometry and material are `new`ed outside React's tree.
    useEffect( () => {
        geometry.setAttribute( 'aDrive', drive );
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [ geometry, material, drive ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( () => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        syncPalette( material, applied.current );

        const array = drive.array as Float32Array;
        let i = 0;
        for ( const entity of world.query( Render, Net ) ) {
            i += writeShip( mesh, array, i, entity );
        }

        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
        drive.needsUpdate = true;
    }, AFTER_RENDER_SYNC );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            args={ [ undefined, undefined, MAX_PLUMES ] }
            renderOrder={ 2 }
        >
            <primitive object={ geometry } attach="geometry" />
            <primitive object={ material } attach="material" />
        </instancedMesh>
    );
}
