import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetProjectile, ProjInterp, type ProjSnapshot } from '../ecs/traits';

const MAX_BOLTS = 64;

function sampleAt( buffer: ProjSnapshot[], renderTime: number ): ProjSnapshot | null {
    if ( buffer.length === 0 ) return null;
    if ( renderTime <= buffer[ 0 ].t ) return buffer[ 0 ];
    for ( let i = 0; i < buffer.length - 1; i++ ) {
        const a = buffer[ i ];
        const b = buffer[ i + 1 ];
        if ( a.t <= renderTime && b.t >= renderTime ) {
            const t = ( renderTime - a.t ) / ( b.t - a.t || 1 );
            return {
                t: renderTime,
                x: a.x + ( b.x - a.x ) * t,
                y: a.y + ( b.y - a.y ) * t,
                z: a.z + ( b.z - a.z ) * t,
            };
        }
    }
    return buffer[ buffer.length - 1 ];
}

export function ProjectileField() {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const m = useMemo( () => new THREE.Object3D(), [] );

    const boltGeo = useMemo( () => {
        const g = new THREE.CapsuleGeometry( 0.055, 30, 4, 8 );
        g.rotateX( Math.PI / 2 );
        return g;
    }, [] );

    // Effect justified: brackets a GPU resource's lifetime. boltGeo is `new`'d in useMemo and attached via
    useEffect( () => () => boltGeo.dispose(), [ boltGeo ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        ref.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        const renderTime = performance.now() - RENDER_DELAY_MS;
        let i = 0;
        world.query( ProjInterp, NetProjectile ).readEach( ( [ interp ] ) => {
            if ( i >= MAX_BOLTS ) return;
            const pos = sampleAt( interp.buffer, renderTime );
            if ( ! pos ) return;
            m.position.set( pos.x, pos.y, pos.z );
            m.updateMatrix();
            mesh.setMatrixAt( i, m.matrix );
            i++;
        } );
        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
    } );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, MAX_BOLTS ] }>
            <primitive object={ boltGeo } attach="geometry" />
            <meshStandardMaterial emissive="#8affff" emissiveIntensity={ 4 } toneMapped={ false } />
        </instancedMesh>
    );
}
