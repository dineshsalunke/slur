import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Net, Render } from '../../ecs/traits';
import { FRAME_PHASE } from '../../frame/frame-phase.constants';
import { useTrack } from '../../track-context/use-track';
import { buildExhaustGeometry } from '../exhaust-geometry';
import { buildExhaustMaterial } from '../exhaust-material';
import { PORT_HEIGHT, PORT_WIDTH } from '../exhaust-ports';
import { ExhaustReflections } from '../exhaust-reflections/exhaust-reflections';
import { MAX_PLUMES } from './exhaust-field.constants';
import { syncPalette, writeShip } from './exhaust-field.utils';

export interface Palette {
    hot: string;
    cool: string;
}

export function ExhaustField() {
    const world = useWorld();
    const track = useTrack();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const applied = useRef< Palette >( { hot: '', cool: '' } );

    const geometry = useMemo( () => buildExhaustGeometry( PORT_WIDTH, PORT_HEIGHT ), [] );
    const material = useMemo( buildExhaustMaterial, [] );
    const drive = useMemo( () => new THREE.InstancedBufferAttribute( new Float32Array( MAX_PLUMES * 3 ), 3 ), [] );
    const deckY = useMemo( () => new THREE.InstancedBufferAttribute( new Float32Array( MAX_PLUMES ), 1 ), [] );

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
        const floors = deckY.array as Float32Array;
        let i = 0;
        for ( const entity of world.query( Render, Net ) ) {
            i += writeShip( mesh, array, floors, i, entity, track );
        }

        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
        drive.needsUpdate = true;
        deckY.needsUpdate = true;
    }, FRAME_PHASE.afterSync );

    return (
        <Fragment>
            <instancedMesh
                ref={ setMesh }
                frustumCulled={ false }
                args={ [ undefined, undefined, MAX_PLUMES ] }
                renderOrder={ 2 }
            >
                <primitive object={ geometry } attach="geometry" />
                <primitive object={ material } attach="material" />
            </instancedMesh>
            <ExhaustReflections source={ meshRef } drive={ drive } deckY={ deckY } />
        </Fragment>
    );
}
