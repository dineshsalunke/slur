import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { accent } from './accent';
import { FRACTURE_CORE_HEX } from './fractured-block-shader';
import { emberTexture, sootTexture } from './meteor-assets';
import { BACK } from './track-instancing';

const LIMIT = 12;
const QUEUE = 4;
const SPREAD = 2.6;
const LIFT = 0.04;
const FLASH = 0.35;
const FLASH_SHARE = 0.7;
const FLICKER = 0.12;

interface Mark {
    x: number;
    y: number;
    z: number;
    size: number;
    turn: number;
    born: number;
    live: boolean;
}

const pending: Omit< Mark, 'born' | 'live' >[] = [];

export function queueScorch( x: number, y: number, z: number, size: number, turn: number ): void {
    if ( pending.length < QUEUE ) pending.push( { x, y, z, size, turn } );
}

const _o = new THREE.Object3D();
const _c = new THREE.Color();
const CORE = new THREE.Color( FRACTURE_CORE_HEX );

function flatPlane(): THREE.PlaneGeometry {
    const g = new THREE.PlaneGeometry( 1, 1 );
    g.rotateX( -Math.PI / 2 );
    return g;
}

function stamp( marks: Mark[], cursor: number, now: number ): number {
    let next = cursor;
    for ( const p of pending ) {
        const m = marks[ next ];
        next = ( next + 1 ) % LIMIT;
        Object.assign( m, p );
        m.born = now;
        m.live = true;
    }
    pending.length = 0;
    return next;
}

function place( m: Mark ): void {
    _o.position.set( m.x, m.y + LIFT, m.z );
    _o.rotation.set( 0, m.turn, 0 );
    _o.scale.setScalar( m.live ? m.size * SPREAD : 0 );
    _o.updateMatrix();
}

function emberColor( age: number, i: number, gain: number, cool: number ): THREE.Color {
    const flash = Math.exp( -age / FLASH );
    const k =
        gain *
        ( 1 - FLASH_SHARE + FLASH_SHARE * flash ) *
        Math.exp( -age / cool ) *
        ( 1 + FLICKER * Math.sin( age * 23 + i * 5.1 ) );
    return _c.copy( accent() ).lerp( CORE, flash ).multiplyScalar( k );
}

export function MeteorScorch() {
    const geometry = useMemo( flatPlane, [] );
    const marks = useMemo< Mark[] >(
        () =>
            Array.from( { length: LIMIT }, () => ( {
                x: 0,
                y: 0,
                z: 0,
                size: 0,
                turn: 0,
                born: 0,
                live: false,
            } ) ),
        [],
    );
    const cursor = useRef( 0 );
    const sootRef = useRef< THREE.InstancedMesh | null >( null );
    const emberRef = useRef< THREE.InstancedMesh | null >( null );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU geometry we built ourselves.
    useEffect( () => () => geometry.dispose(), [ geometry ] );

    useFrame( ( state ) => {
        const soot = sootRef.current;
        const ember = emberRef.current;
        if ( ! soot || ! ember ) return;
        const now = state.clock.elapsedTime;
        cursor.current = stamp( marks, cursor.current, now );
        const camZ = state.camera.position.z;
        const gain = num( 'Meteor.ember' );
        const cool = Math.max( 0.1, num( 'Meteor.cool' ) );
        let top = 0;
        for ( let i = 0; i < LIMIT; i++ ) {
            const m = marks[ i ];
            if ( m.live && m.z < camZ - BACK ) m.live = false;
            place( m );
            soot.setMatrixAt( i, _o.matrix );
            ember.setMatrixAt( i, _o.matrix );
            if ( ! m.live ) continue;
            top = i + 1;
            ember.setColorAt( i, emberColor( now - m.born, i, gain, cool ) );
        }
        soot.count = top;
        ember.count = top;
        soot.instanceMatrix.needsUpdate = true;
        ember.instanceMatrix.needsUpdate = true;
        if ( ember.instanceColor ) ember.instanceColor.needsUpdate = true;
    } );

    return (
        <Fragment>
            <instancedMesh
                ref={ sootRef }
                args={ [ geometry, undefined, LIMIT ] }
                count={ 0 }
                frustumCulled={ false }
                renderOrder={ 1 }
            >
                <meshBasicMaterial
                    color="#000000"
                    map={ sootTexture() }
                    transparent
                    depthWrite={ false }
                    polygonOffset
                    polygonOffsetFactor={ -2 }
                    polygonOffsetUnits={ -2 }
                    fog={ false }
                />
            </instancedMesh>
            <instancedMesh
                ref={ ( m ) => {
                    emberRef.current = m;
                    if ( m ) m.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
                } }
                args={ [ geometry, undefined, LIMIT ] }
                count={ 0 }
                frustumCulled={ false }
                renderOrder={ 2 }
            >
                <meshBasicMaterial
                    map={ emberTexture() }
                    transparent
                    depthWrite={ false }
                    blending={ THREE.AdditiveBlending }
                    polygonOffset
                    polygonOffsetFactor={ -3 }
                    polygonOffsetUnits={ -3 }
                    fog={ false }
                />
            </instancedMesh>
        </Fragment>
    );
}
