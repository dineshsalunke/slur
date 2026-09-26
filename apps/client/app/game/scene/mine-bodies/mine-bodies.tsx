import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { accent } from '../accent';
import { commitInstances } from '../instanced-commit';
import { MAX_MINES, MINE_CORE_INTENSITY, MINE_DECAL_INTENSITY, mineGlow } from '../mine-look';
import type { BodyPose } from '../mine-throw';
import { _c, _o, HOT } from './mine-bodies.constants';
import { buildLook, phaseOf, place } from './mine-bodies.utils';

export type MineSink = ( x: number, y: number, z: number, armed: boolean, pose: BodyPose ) => void;

interface Frame {
    body: THREE.InstancedMesh | null;
    core: THREE.InstancedMesh | null;
    decal: THREE.InstancedMesh | null;
    count: number;
    t: number;
}

export function MineBodies( { collect }: { collect: ( sink: MineSink ) => void } ) {
    const look = useMemo( buildLook, [] );
    const frame = useMemo< Frame >( () => ( { body: null, core: null, decal: null, count: 0, t: 0 } ), [] );

    // Effect justified: brackets GPU resources built in useMemo, which R3F does not dispose.
    useEffect(
        () => () => {
            for ( const r of Object.values( look ) ) r.dispose();
        },
        [ look ],
    );

    const sink = useMemo< MineSink >(
        () => ( x, y, z, armed, pose ) => {
            const { body, core, decal } = frame;
            if ( ! body || ! core || ! decal || ! pose.visible || frame.count >= MAX_MINES ) return;
            const i = frame.count++;
            _o.position.set( x, y, z );
            const wide = 1 + ( 1 - pose.squash ) * 0.5;
            place( body, i, wide, pose.squash, wide );
            place( core, i, 1, pose.squash * pose.open, 1 );
            place( decal, i, pose.open, 1, pose.open );
            look.bodyGeo.getAttribute( 'aOpen' ).setX( i, pose.open );
            const glow = mineGlow( armed, frame.t, phaseOf( x, z ) ) * pose.open;
            core.setColorAt( i, _c.copy( HOT ).multiplyScalar( MINE_CORE_INTENSITY * glow ) );
            decal.setColorAt( i, _c.copy( accent() ).multiplyScalar( MINE_DECAL_INTENSITY * glow ) );
        },
        [ frame, look ],
    );

    const setBody = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.body = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );
    const setCore = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.core = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );
    const setDecal = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.decal = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );

    useFrame( ( state ) => {
        const { body, core, decal } = frame;
        if ( ! body || ! core || ! decal ) return;
        frame.count = 0;
        frame.t = state.clock.elapsedTime;
        collect( sink );
        commitInstances( body, frame.count );
        commitInstances( core, frame.count );
        commitInstances( decal, frame.count );
        look.bodyGeo.getAttribute( 'aOpen' ).needsUpdate = true;
    } );

    return (
        <group>
            <instancedMesh ref={ setBody } frustumCulled={ false } args={ [ look.bodyGeo, look.body, MAX_MINES ] } />
            <instancedMesh
                ref={ setDecal }
                frustumCulled={ false }
                renderOrder={ 1 }
                args={ [ look.decalGeo, look.decal, MAX_MINES ] }
            />
            <instancedMesh
                ref={ setCore }
                frustumCulled={ false }
                renderOrder={ 2 }
                args={ [ look.coreGeo, look.core, MAX_MINES ] }
            />
        </group>
    );
}
