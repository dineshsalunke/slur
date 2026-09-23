import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { accent } from './accent';
import { advanceEmbers, type EmberPool, MAX_EMBERS, makeEmberPool, shedEmbers } from './bolt-embers';
import { BOLT_HOT } from './combat-look';
import {
    MAX_SEEKERS,
    SEEKER_EMBER_SPAN,
    SEEKER_FLIGHT,
    SEEKER_TRAIL_BRIGHT,
    SEEKER_TRAIL_HEAT,
    SEEKER_TRAIL_WIDTH,
    seekerTrailSegmentGeometry,
} from './seeker-look';
import { buildSeekerBody } from './seeker-pickups';
import { advanceSeekerTrail, type SeekerTrailRing, TRAIL_POINTS, trailIndex } from './seeker-trail';

export type SeekerSink = ( x: number, y: number, z: number, trail: SeekerTrailRing ) => void;

const MAX_SEGMENTS = MAX_SEEKERS * TRAIL_POINTS;
const HOT = new THREE.Color( BOLT_HOT );
const FORWARD = new THREE.Vector3( 0, 0, 1 );
const _o = new THREE.Object3D();
const _dir = new THREE.Vector3();
const _c = new THREE.Color();
const _black = new THREE.Color( 0, 0, 0 );

interface Frame {
    parts: ( THREE.InstancedMesh | null )[];
    trail: THREE.InstancedMesh | null;
    embers: THREE.InstancedMesh | null;
    pool: EmberPool;
    count: number;
    segments: number;
}

function buildLook() {
    return {
        body: buildSeekerBody(),
        segmentGeo: seekerTrailSegmentGeometry(),
        trail: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } ),
        emberGeo: new THREE.OctahedronGeometry( 1, 0 ),
        ember: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } ),
    };
}

function writeSegment(
    frame: Frame,
    mesh: THREE.InstancedMesh,
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    fade: number,
): void {
    _dir.set( bx - ax, by - ay, bz - az );
    const len = _dir.length();
    if ( len < 1e-3 || frame.segments >= MAX_SEGMENTS ) return;
    _dir.divideScalar( len );
    const w = SEEKER_TRAIL_WIDTH * fade * fade;
    _o.position.set( ax, ay, az );
    _o.quaternion.setFromUnitVectors( FORWARD, _dir );
    _o.scale.set( w, w, len );
    _o.updateMatrix();
    mesh.setMatrixAt( frame.segments, _o.matrix );
    _c.copy( accent() )
        .lerp( HOT, SEEKER_TRAIL_HEAT * fade * fade )
        .multiplyScalar( SEEKER_TRAIL_BRIGHT * fade * fade );
    mesh.setColorAt( frame.segments, _c );
    frame.segments++;
}

function writeTrail( frame: Frame, mesh: THREE.InstancedMesh, x: number, y: number, z: number, r: SeekerTrailRing ) {
    let px = x - r.hx * SEEKER_FLIGHT.halfLen;
    let py = y - r.hy * SEEKER_FLIGHT.halfLen;
    let pz = z - r.hz * SEEKER_FLIGHT.halfLen;
    let started = false;
    for ( let k = 0; k < r.count; k++ ) {
        const i = trailIndex( r, k );
        const qx = r.x[ i ];
        const qy = r.y[ i ];
        const qz = r.z[ i ];
        if ( ! started && ( qx - px ) * r.hx + ( qy - py ) * r.hy + ( qz - pz ) * r.hz >= 0 ) continue;
        started = true;
        writeSegment( frame, mesh, px, py, pz, qx, qy, qz, 1 - k / TRAIL_POINTS );
        px = qx;
        py = qy;
        pz = qz;
    }
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
