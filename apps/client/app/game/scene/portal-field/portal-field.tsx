import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo } from 'react';
import type * as THREE from 'three';
import { blockWorld } from '../../block-state';
import { commitInstances } from '../instanced-commit';
import { MAX_PORTAL_ENDS, MAX_PORTAL_MARKS } from './portal-field.constants';
import {
    buildPortalLook,
    collectPortalEnds,
    disposePortalLook,
    type PortalEndSink,
    type PortalFrame,
    writePortalEnd,
} from './portal-field.utils';

export function PortalField() {
    const look = useMemo( buildPortalLook, [] );
    const frame = useMemo< PortalFrame >(
        () => ( { shell: null, sleeve: null, mark: null, ends: 0, marks: 0, t: 0 } ),
        [],
    );
    const sink = useMemo< PortalEndSink >(
        () => ( x, y, z, live, marks ) => writePortalEnd( frame, x, y, z, live, marks ),
        [ frame ],
    );

    const setShell = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.shell = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );
    const setSleeve = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.sleeve = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );
    const setMark = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.mark = mesh;
            if ( mesh ) mesh.count = 0;
        },
        [ frame ],
    );
    const release = useCallback(
        ( group: THREE.Group | null ) => () => {
            if ( group ) disposePortalLook( look );
        },
        [ look ],
    );

    useFrame( ( state ) => {
        const { shell, sleeve, mark } = frame;
        if ( ! shell || ! sleeve || ! mark ) return;
        frame.ends = 0;
        frame.marks = 0;
        frame.t = state.clock.elapsedTime;
        collectPortalEnds( blockWorld.portals.values(), sink );
        commitInstances( shell, frame.ends );
        commitInstances( sleeve, frame.ends );
        commitInstances( mark, frame.marks );
    } );

    return (
        <group ref={ release }>
            <instancedMesh
                ref={ setShell }
                frustumCulled={ false }
                args={ [ look.shell, look.metal, MAX_PORTAL_ENDS ] }
            />
            <instancedMesh
                ref={ setSleeve }
                frustumCulled={ false }
                args={ [ look.sleeve, look.glow, MAX_PORTAL_ENDS ] }
            />
            <instancedMesh
                ref={ setMark }
                frustumCulled={ false }
                args={ [ look.mark, look.glow, MAX_PORTAL_MARKS ] }
            />
        </group>
    );
}
