import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { emberTexture, sootTexture } from '../meteor-assets';
import { BACK } from '../track-instancing';
import { _c, _o, LIMIT } from './meteor-scorch.constants';
import { emberColor, flatPlane, place, stamp } from './meteor-scorch.utils';

export interface Mark {
    x: number;
    y: number;
    z: number;
    size: number;
    turn: number;
    born: number;
    live: boolean;
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
