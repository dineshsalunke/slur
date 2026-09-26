import { useFrame } from '@react-three/fiber';
import { DEFAULT_SIM_CONFIG, tuningForShip } from '@slur/shared';
import type { Entity } from 'koota';
import { useWorld } from 'koota/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Interp, Net, Render, Sim } from '../ecs/traits';
import {
    BOOST_STREAK_LENGTH,
    BOOST_STREAK_LIFT,
    BOOST_STREAK_SPREAD,
    BOOST_STREAK_WIDTH,
    boostStreakGeometry,
} from './boost-look';
import { buildBoostStreakMaterial } from './boost-streak-material';

const MAX_SHIPS = 12;
const PER_SHIP = 2;
const MAX_STREAKS = MAX_SHIPS * PER_SHIP;
const AFTER_RENDER_SYNC = 0.25;
const SIDES = [ -1, 1 ];

const _ship = new THREE.Matrix4();
const _local = new THREE.Matrix4();
const _instance = new THREE.Matrix4();
const _offset = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _identity = new THREE.Quaternion();

function boostTimerOf( entity: Entity ): number {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead ? 0 : sim.boostTimer;
    const buffer = entity.get( Interp )?.buffer;
    const last = buffer?.[ buffer.length - 1 ];
    return ! last || last.dead ? 0 : last.boost;
}

export function boostLevel( timer: number, easeS: number = DEFAULT_SIM_CONFIG.boostEaseS ): number {
    if ( timer <= 0 ) return 0;
    return easeS > 0 ? Math.min( 1, timer / easeS ) : 1;
}

function writeShip( mesh: THREE.InstancedMesh, levels: Float32Array, at: number, entity: Entity ): number {
    const group = entity.get( Render );
    const net = entity.get( Net );
    if ( ! group || ! net || ! group.visible ) return 0;

    const level = boostLevel( boostTimerOf( entity ) );
    if ( level <= 0 ) return 0;

    const hull = tuningForShip( net.shipId );
    _ship.compose( group.position, group.quaternion, group.scale );
    _scale.set( BOOST_STREAK_WIDTH, 1, BOOST_STREAK_LENGTH * level );
    for ( let i = 0; i < PER_SHIP; i++ ) {
        _offset.set( SIDES[ i ] * BOOST_STREAK_SPREAD * hull.halfW, BOOST_STREAK_LIFT, -hull.halfL );
        _local.compose( _offset, _identity, _scale );
        _instance.multiplyMatrices( _ship, _local );
        mesh.setMatrixAt( at + i, _instance );
        levels[ at + i ] = level;
    }
    return PER_SHIP;
}

export function BoostStreaks() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    const geometry = useMemo( boostStreakGeometry, [] );
    const material = useMemo( buildBoostStreakMaterial, [] );
    const levels = useMemo( () => new THREE.InstancedBufferAttribute( new Float32Array( MAX_STREAKS ), 1 ), [] );

    // Effect justified: brackets a GPU resource's lifetime — geometry and material are `new`ed outside React's tree.
    useEffect( () => {
        geometry.setAttribute( 'aLevel', levels );
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [ geometry, material, levels ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( () => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const array = levels.array as Float32Array;
        let i = 0;
        for ( const entity of world.query( Render, Net ) ) {
            if ( i + PER_SHIP > MAX_STREAKS ) break;
            i += writeShip( mesh, array, i, entity );
        }
        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
        levels.needsUpdate = true;
    }, AFTER_RENDER_SYNC );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            args={ [ undefined, undefined, MAX_STREAKS ] }
            renderOrder={ 2 }
        >
            <primitive object={ geometry } attach="geometry" />
            <primitive object={ material } attach="material" />
        </instancedMesh>
    );
}
