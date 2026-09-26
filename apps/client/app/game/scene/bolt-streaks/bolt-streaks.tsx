import { useFrame } from '@react-three/fiber';
import { BOLT_SPEED } from '@slur/shared';
import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { noteBolt } from '../block-breaks';
import { advanceEmbers, type EmberPool, MAX_EMBERS, makeEmberPool, shedEmbers } from '../bolt-embers';
import { BOLT_STREAK_LENGTH, MAX_BOLTS } from '../combat-look';
import { _black, _o } from './bolt-streaks.constants';
import { buildLook } from './bolt-streaks.utils';

export type BoltSink = ( x: number, y: number, z: number, traveled: number, dir: number, pitch?: number ) => void;

interface Frame {
    core: THREE.InstancedMesh | null;
    sheath: THREE.InstancedMesh | null;
    embers: THREE.InstancedMesh | null;
    pool: EmberPool;
    count: number;
    shed: number;
}

export function BoltStreaks( { collect }: { collect: ( sink: BoltSink ) => void } ) {
    const look = useMemo( buildLook, [] );
    const frame = useMemo< Frame >(
        () => ( { core: null, sheath: null, embers: null, pool: makeEmberPool(), count: 0, shed: 0 } ),
        [],
    );

    // Effect justified: brackets GPU resources built in useMemo, which R3F does not dispose.
    useEffect(
        () => () => {
            for ( const r of Object.values( look ) ) r.dispose();
        },
        [ look ],
    );

    const sink = useMemo< BoltSink >(
        () =>
            ( x, y, z, traveled, dir, pitch = 0 ) => {
                const { core, sheath } = frame;
                if ( ! core || ! sheath || frame.count >= MAX_BOLTS ) return;
                const length = Math.max( 0.5, Math.min( BOLT_STREAK_LENGTH, traveled ) );
                _o.position.set( x, y, z );
                _o.rotation.set( dir < 0 ? pitch : -pitch, dir < 0 ? Math.PI : 0, 0 );
                _o.scale.set( 1, 1, length );
                _o.updateMatrix();
                core.setMatrixAt( frame.count, _o.matrix );
                sheath.setMatrixAt( frame.count, _o.matrix );
                frame.count++;
                noteBolt( x, y, z );
                shedEmbers( frame.pool, x, y, z, dir * Math.min( length, frame.shed ) );
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

    const setSheath = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.sheath = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );

    const setEmbers = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.embers = mesh;
            if ( ! mesh ) return;
            for ( let i = 0; i < MAX_EMBERS; i++ ) mesh.setColorAt( i, _black );
        },
        [ frame ],
    );

    useFrame( ( _state, delta ) => {
        const { core, sheath, embers } = frame;
        if ( ! core || ! sheath || ! embers ) return;
        frame.count = 0;
        frame.shed = BOLT_SPEED * delta;
        collect( sink );
        core.count = frame.count;
        sheath.count = frame.count;
        core.instanceMatrix.needsUpdate = true;
        sheath.instanceMatrix.needsUpdate = true;
        advanceEmbers( embers, frame.pool, delta );
    } );

    return (
        <group>
            <instancedMesh
                ref={ setSheath }
                frustumCulled={ false }
                renderOrder={ 2 }
                args={ [ look.streakGeo, look.sheath, MAX_BOLTS ] }
            />
            <instancedMesh
                ref={ setCore }
                frustumCulled={ false }
                renderOrder={ 3 }
                args={ [ look.streakGeo, look.core, MAX_BOLTS ] }
            />
            <instancedMesh
                ref={ setEmbers }
                frustumCulled={ false }
                renderOrder={ 3 }
                args={ [ look.emberGeo, look.ember, MAX_EMBERS ] }
            />
        </group>
    );
}
