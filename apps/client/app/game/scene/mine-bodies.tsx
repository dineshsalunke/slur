import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT } from './combat-look';
import {
    MAX_MINES,
    MINE_CORE_INTENSITY,
    MINE_DECAL_INTENSITY,
    mineBodyGeometry,
    mineCoreGeometry,
    mineDecalGeometry,
    mineGlow,
} from './mine-look';
import { graphiteShellMaterial } from './track-materials';

export type MineSink = ( x: number, y: number, z: number, armed: boolean ) => void;

const _o = new THREE.Object3D();
const _c = new THREE.Color();
const HOT = new THREE.Color( BOLT_HOT );

interface Frame {
    body: THREE.InstancedMesh | null;
    core: THREE.InstancedMesh | null;
    decal: THREE.InstancedMesh | null;
    count: number;
    t: number;
}

function glowMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial( {
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
    } );
}

function buildLook() {
    return {
        bodyGeo: mineBodyGeometry(),
        coreGeo: mineCoreGeometry(),
        decalGeo: mineDecalGeometry(),
        body: graphiteShellMaterial(),
        core: glowMaterial(),
        decal: glowMaterial(),
    };
}

function phaseOf( x: number, z: number ): number {
    const h = Math.sin( x * 12.9898 + z * 78.233 ) * 43758.5453;
    return h - Math.floor( h );
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
        () => ( x, y, z, armed ) => {
            const { body, core, decal } = frame;
            if ( ! body || ! core || ! decal || frame.count >= MAX_MINES ) return;
            const i = frame.count++;
            _o.position.set( x, y, z );
            _o.updateMatrix();
            body.setMatrixAt( i, _o.matrix );
            core.setMatrixAt( i, _o.matrix );
            decal.setMatrixAt( i, _o.matrix );
            const glow = mineGlow( armed, frame.t, phaseOf( x, z ) );
            core.setColorAt( i, _c.copy( HOT ).multiplyScalar( MINE_CORE_INTENSITY * glow ) );
            decal.setColorAt( i, _c.copy( accent() ).multiplyScalar( MINE_DECAL_INTENSITY * glow ) );
        },
        [ frame ],
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
        for ( const m of [ body, core, decal ] ) {
            m.count = frame.count;
            m.instanceMatrix.needsUpdate = true;
            if ( m.instanceColor ) m.instanceColor.needsUpdate = true;
        }
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
