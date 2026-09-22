import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useWorld } from 'koota/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { Net, Render } from '../ecs/traits';
import { exhaustDrive } from './exhaust-drive';
import { buildExhaustGeometry } from './exhaust-geometry';
import { buildExhaustMaterial } from './exhaust-material';
import { exhaustPorts, MAX_PORTS_PER_SHIP, PORT_HEIGHT, PORT_WIDTH } from './exhaust-ports';

const MAX_SHIPS = 12;
const MAX_PLUMES = MAX_SHIPS * MAX_PORTS_PER_SHIP;
const SPREAD_AT_IDLE = 0.82;
const AFTER_RENDER_SYNC = 0.25;

const _ship = new THREE.Matrix4();
const _port = new THREE.Matrix4();
const _instance = new THREE.Matrix4();

interface Palette {
    hot: string;
    cool: string;
}

function syncPalette( material: THREE.ShaderMaterial, applied: Palette ): void {
    const hot = col( 'Exhaust.hot' );
    if ( hot !== applied.hot ) {
        ( material.uniforms.uHot.value as THREE.Color ).set( hot );
        applied.hot = hot;
    }
    const cool = col( 'Exhaust.cool' );
    if ( cool !== applied.cool ) {
        ( material.uniforms.uCool.value as THREE.Color ).set( cool );
        applied.cool = cool;
    }
    material.uniforms.uSoftness.value = num( 'Exhaust.softness' );
    material.uniforms.uFalloff.value = num( 'Exhaust.falloff' );
    material.uniforms.uHeat.value = num( 'Exhaust.heat' );
}

function writeShip( mesh: THREE.InstancedMesh, drive: Float32Array, at: number, entity: Entity ): number {
    const group = entity.get( Render );
    const net = entity.get( Net );
    if ( ! group || ! net || ! group.visible ) return 0;

    const ports = exhaustPorts( net.shipId );
    if ( ! ports || at + ports.length > MAX_PLUMES ) return 0;

    const throttle = exhaustDrive( entity );
    if ( throttle < 0 ) return 0;

    const idle = num( 'Exhaust.idle' );
    const ramp = idle + ( 1 - idle ) * throttle;
    const stretch = num( 'Exhaust.length' ) * ramp;
    const widen = num( 'Exhaust.spread' ) * ( SPREAD_AT_IDLE + ( 1 - SPREAD_AT_IDLE ) * throttle );
    const brightness = num( 'Exhaust.glow' ) * ramp;

    _ship.compose( group.position, group.quaternion, group.scale );
    for ( let p = 0; p < ports.length; p++ ) {
        const port = ports[ p ];
        _port.makeTranslation( port.x, port.y, port.z );
        _instance.multiplyMatrices( _ship, _port );
        mesh.setMatrixAt( at + p, _instance );
        drive[ ( at + p ) * 3 ] = stretch;
        drive[ ( at + p ) * 3 + 1 ] = widen;
        drive[ ( at + p ) * 3 + 2 ] = brightness;
    }
    return ports.length;
}

export function ExhaustField() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const applied = useRef< Palette >( { hot: '', cool: '' } );

    const geometry = useMemo( () => buildExhaustGeometry( PORT_WIDTH, PORT_HEIGHT ), [] );
    const material = useMemo( buildExhaustMaterial, [] );
    const drive = useMemo( () => new THREE.InstancedBufferAttribute( new Float32Array( MAX_PLUMES * 3 ), 3 ), [] );

    // Effect justified: brackets a GPU resource's lifetime — geometry and material are `new`ed outside React's tree.
    useEffect( () => {
        geometry.setAttribute( 'aDrive', drive );
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [ geometry, material, drive ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( () => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        syncPalette( material, applied.current );

        const array = drive.array as Float32Array;
        let i = 0;
        for ( const entity of world.query( Render, Net ) ) {
            i += writeShip( mesh, array, i, entity );
        }

        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
        drive.needsUpdate = true;
    }, AFTER_RENDER_SYNC );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            args={ [ undefined, undefined, MAX_PLUMES ] }
            renderOrder={ 2 }
        >
            <primitive object={ geometry } attach="geometry" />
            <primitive object={ material } attach="material" />
        </instancedMesh>
    );
}
