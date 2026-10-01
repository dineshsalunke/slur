import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { blockWorld } from '../../block-state';
import { FRAME_PHASE } from '../../frame/frame-phase.constants';
import { useTrack } from '../../track-context/use-track';
import { trackGround } from '../debris-ground';
import type { DebrisGround } from '../debris-physics';
import { meteorTrailGeometry, repaintTrail } from '../meteor-assets';
import { applyShape, meteorMaterial, meteorUniforms, tuneMeteor } from '../meteor-material';
import { useMeteorRock } from '../meteor-rock/use-meteor-rock';
import { FLIGHTS, LIGHT_DISTANCE } from './meteor-strikes.constants';
import { _c } from './meteor-strikes.scratch';
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
    refZ: number;
    refT: number;
    speed: number;
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

export function MeteorStrikes() {
    const track = useTrack();
    const rock = useMeteorRock();
    const director = useMemo( () => makeDirector( trackGround( track, blockWorld.broken ) ), [ track ] );
    const uniforms = useMemo( meteorUniforms, [] );
    const material = useMemo( () => meteorMaterial( uniforms, false ), [ uniforms ] );
    const head = useMemo( () => {
        applyShape( uniforms, rock.shape );
        const heat = new THREE.InstancedBufferAttribute( new Float32Array( FLIGHTS ).fill( 1 ), 1 );
        const vel = new THREE.InstancedBufferAttribute( new Float32Array( FLIGHTS * 3 ), 3 );
        heat.setUsage( THREE.DynamicDrawUsage );
        vel.setUsage( THREE.DynamicDrawUsage );
        rock.head.setAttribute( 'aMeteorHeat', heat );
        rock.head.setAttribute( 'aMeteorVel', vel );
        return rock.head;
    }, [ rock, uniforms ] );
    const trail = useMemo( meteorTrailGeometry, [] );
    const glow = useMemo( () => new THREE.IcosahedronGeometry( 1, 2 ), [] );
    const meshes = useRef< Meshes >( { heads: null, trails: null, glows: null } );
    const lightRef = useRef< THREE.PointLight | null >( null );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU geometry and a material we built ourselves.
    useEffect(
        () => () => {
            material.dispose();
            trail.dispose();
            glow.dispose();
        },
        [ material, trail, glow ],
    );

    useFrame( ( state ) => {
        const { heads, trails, glows } = meshes.current;
        if ( ! heads || ! trails || ! glows ) return;
        repaintTrail( trail );
        const m = meshes.current as ReadyMeshes;
        const now = state.clock.elapsedTime;
        tuneMeteor( uniforms, material, now );
        schedule( director, state.camera.position.x, state.camera.position.z, now );
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
    }, FRAME_PHASE.view );

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
