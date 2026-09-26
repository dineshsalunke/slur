import { useFrame } from '@react-three/fiber';
import { DEFAULT_PORTAL_CONFIG } from '@slur/shared';
import { useCallback, useMemo } from 'react';
import type * as THREE from 'three';
import { blockWorld } from '../../block-state';
import { accent } from '../accent';
import { commitInstances } from '../instanced-commit';
import { _c, _o, MAX_PORTAL_ENDS } from './portal-field.constants';
import { buildPortalLook, collectPortalEnds, type PortalEndSink, portalGlow } from './portal-field.utils';

interface Frame {
    ring: THREE.InstancedMesh | null;
    count: number;
    t: number;
}

export function PortalField() {
    const look = useMemo( buildPortalLook, [] );
    const frame = useMemo< Frame >( () => ( { ring: null, count: 0, t: 0 } ), [] );

    const sink = useMemo< PortalEndSink >(
        () => ( x, y, z, live ) => {
            const { ring } = frame;
            if ( ! ring || frame.count >= MAX_PORTAL_ENDS ) return;
            const i = frame.count++;
            _o.position.set( x, y + DEFAULT_PORTAL_CONFIG.portalR, z );
            _o.updateMatrix();
            ring.setMatrixAt( i, _o.matrix );
            ring.setColorAt( i, _c.copy( accent() ).multiplyScalar( portalGlow( live, frame.t ) ) );
        },
        [ frame ],
    );

    const setRing = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.ring = mesh;
            if ( mesh ) mesh.count = 0;
            return () => {
                frame.ring = null;
                look.geometry.dispose();
                look.material.dispose();
            };
        },
        [ frame, look ],
    );

    useFrame( ( state ) => {
        const { ring } = frame;
        if ( ! ring ) return;
        frame.count = 0;
        frame.t = state.clock.elapsedTime;
        collectPortalEnds( blockWorld.portals.values(), sink );
        commitInstances( ring, frame.count );
    } );

    return (
        <instancedMesh
            ref={ setRing }
            frustumCulled={ false }
            args={ [ look.geometry, look.material, MAX_PORTAL_ENDS ] }
        />
    );
}
