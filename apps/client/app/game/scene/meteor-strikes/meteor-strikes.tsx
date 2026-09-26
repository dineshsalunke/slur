import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { blockWorld } from '../../block-state';
import { LocalPlayer, Sim } from '../../ecs/traits';
import { useTrack } from '../../track-context/use-track';
import { asteroidGeometry } from '../asteroid-geometry';
import { trackGround } from '../debris-ground';
import type { DebrisGround } from '../debris-physics';
import { meteorTrailGeometry } from '../meteor-assets';
import { _c, FLIGHTS, HEAD_DETAIL, HEAD_SEED, LIGHT_DISTANCE } from './meteor-strikes.constants';
import { advance, commit, draw, flash, hide, makeDirector, schedule } from './meteor-strikes.utils';

export interface Flight {
    live: boolean;
    landed: boolean;
    t0: number;
    flight: number;
    start: THREE.Vector3;
    vel: THREE.Vector3;
    tail: THREE.Quaternion;
    axis: THREE.Vector3;
    floor: number;
    size: number;
    spin: number;
    speed: number;
}

export interface Director {
    flights: Flight[];
    ground: DebrisGround;
    cursor: number;
    lastZ: number;
    lightAt: number;
    lightSize: number;
    lightX: number;
    lightY: number;
    lightZ: number;
}

interface Meshes {
    heads: THREE.InstancedMesh | null;
    trails: THREE.InstancedMesh | null;
    glows: THREE.InstancedMesh | null;
}

export interface ReadyMeshes {
    heads: THREE.InstancedMesh;
    trails: THREE.InstancedMesh;
    glows: THREE.InstancedMesh;
}

export function MeteorStrikes( { material }: { material: THREE.Material } ) {
    const track = useTrack();
    const world = useWorld();
    const director = useMemo( () => makeDirector( trackGround( track, blockWorld.broken ) ), [ track ] );
    const head = useMemo( () => {
        const g = asteroidGeometry( HEAD_SEED, HEAD_DETAIL );
        g.setAttribute( 'aRockHeat', new THREE.InstancedBufferAttribute( new Float32Array( FLIGHTS ).fill( 1 ), 1 ) );
        return g;
    }, [] );
    const trail = useMemo( meteorTrailGeometry, [] );
    const glow = useMemo( () => new THREE.IcosahedronGeometry( 1, 2 ), [] );
    const meshes = useRef< Meshes >( { heads: null, trails: null, glows: null } );
    const lightRef = useRef< THREE.PointLight | null >( null );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU geometry we built ourselves.
    useEffect(
        () => () => {
            head.dispose();
            trail.dispose();
            glow.dispose();
        },
        [ head, trail, glow ],
    );

    useFrame( ( state ) => {
        const { heads, trails, glows } = meshes.current;
        if ( ! heads || ! trails || ! glows ) return;
        const m = meshes.current as ReadyMeshes;
        const now = state.clock.elapsedTime;
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( sim ) schedule( director, sim.z, sim.vz, now );
        const gain = num( 'Meteor.trail' );
        let top = 0;
        for ( let i = 0; i < FLIGHTS; i++ ) {
            const f = director.flights[ i ];
            if ( ! advance( director, f, now ) ) {
                hide( m, i );
                continue;
            }
            top = i + 1;
            draw( m, f, i, now, gain );
        }
        commit( heads, top );
        commit( trails, top );
        commit( glows, top );
        if ( lightRef.current ) flash( lightRef.current, director, now );
    } );

    return (
        <Fragment>
            <instancedMesh
                ref={ ( x ) => {
                    meshes.current.heads = x;
                } }
                args={ [ head, material, FLIGHTS ] }
                count={ 0 }
                frustumCulled={ false }
            />
            <instancedMesh
                ref={ ( x ) => {
                    meshes.current.trails = x;
                    if ( x ) x.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
                } }
                args={ [ trail, undefined, FLIGHTS ] }
                count={ 0 }
                frustumCulled={ false }
            >
                <meshBasicMaterial
                    vertexColors
                    transparent
                    depthWrite={ false }
                    blending={ THREE.AdditiveBlending }
                    side={ THREE.DoubleSide }
                    fog={ false }
                />
            </instancedMesh>
            <instancedMesh
                ref={ ( x ) => {
                    meshes.current.glows = x;
                    if ( x ) x.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
                } }
                args={ [ glow, undefined, FLIGHTS ] }
                count={ 0 }
                frustumCulled={ false }
            >
                <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } fog={ false } />
            </instancedMesh>
            <pointLight ref={ lightRef } intensity={ 0 } distance={ LIGHT_DISTANCE } decay={ 2 } />
        </Fragment>
    );
}
