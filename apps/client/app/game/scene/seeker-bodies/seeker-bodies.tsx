import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { advanceEmbers, type EmberPool, MAX_EMBERS, makeEmberPool, shedEmbers } from '../bolt-embers';
import { MAX_SEEKERS, SEEKER_EMBER_SPAN } from '../seeker-look';
import { advanceSeekerTrail, type SeekerTrailRing } from '../seeker-trail';
import { _black, _dir, _o, FORWARD, MAX_SEGMENTS } from './seeker-bodies.constants';
import { buildLook, writeTrail } from './seeker-bodies.utils';

export type SeekerSink = ( x: number, y: number, z: number, trail: SeekerTrailRing ) => void;

export interface Frame {
    parts: ( THREE.InstancedMesh | null )[];
    trail: THREE.InstancedMesh | null;
    embers: THREE.InstancedMesh | null;
    pool: EmberPool;
    count: number;
    segments: number;
}

export function SeekerBodies( { collect }: { collect: ( sink: SeekerSink ) => void } ) {
    const look = useMemo( buildLook, [] );
    const frame = useMemo< Frame >(
        () => ( { parts: [], trail: null, embers: null, pool: makeEmberPool(), count: 0, segments: 0 } ),
        [],
    );

    // Effect justified: brackets GPU resources built in useMemo, which R3F does not dispose.
    useEffect(
        () => () => {
            for ( const part of look.body ) {
                part.geometry.dispose();
                part.material.dispose();
            }
            look.segmentGeo.dispose();
            look.trail.dispose();
            look.emberGeo.dispose();
            look.ember.dispose();
        },
        [ look ],
    );

    const sink = useMemo< SeekerSink >(
        () => ( x, y, z, r ) => {
            const { trail } = frame;
            if ( ! trail || frame.count >= MAX_SEEKERS ) return;
            advanceSeekerTrail( r, x, y, z );
            _dir.set( r.hx, r.hy, r.hz );
            _o.position.set( x, y, z );
            _o.quaternion.setFromUnitVectors( FORWARD, _dir );
            _o.scale.setScalar( 1 );
            _o.updateMatrix();
            for ( const m of frame.parts ) m?.setMatrixAt( frame.count, _o.matrix );
            frame.count++;
            writeTrail( frame, trail, x, y, z, r );
            shedEmbers( frame.pool, x, y, z, SEEKER_EMBER_SPAN );
        },
        [ frame ],
    );

    const setTrail = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            frame.trail = mesh;
            if ( ! mesh ) return;
            for ( let i = 0; i < MAX_SEGMENTS; i++ ) mesh.setColorAt( i, _black );
            mesh.count = 0;
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
        const { trail, embers } = frame;
        if ( ! trail || ! embers ) return;
        frame.count = 0;
        frame.segments = 0;
        collect( sink );
        for ( const m of frame.parts ) {
            if ( ! m ) continue;
            m.count = frame.count;
            m.instanceMatrix.needsUpdate = true;
        }
        trail.count = frame.segments;
        trail.instanceMatrix.needsUpdate = true;
        if ( trail.instanceColor ) trail.instanceColor.needsUpdate = true;
        advanceEmbers( embers, frame.pool, delta );
    } );

    return (
        <group>
            { look.body.map( ( part, i ) => (
                <instancedMesh
                    key={ part.geometry.uuid }
                    ref={ ( m ) => {
                        frame.parts[ i ] = m;
                        if ( m ) m.count = 0;
                    } }
                    frustumCulled={ false }
                    args={ [ part.geometry, part.material, MAX_SEEKERS ] }
                />
            ) ) }
            <instancedMesh
                ref={ setTrail }
                frustumCulled={ false }
                renderOrder={ 2 }
                args={ [ look.segmentGeo, look.trail, MAX_SEGMENTS ] }
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
