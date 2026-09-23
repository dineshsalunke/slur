import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { accent } from './accent';
import { FRACTURE_CORE_HEX } from './fractured-block-shader';

const SLOTS = 16;

interface Burst {
    x: number;
    y: number;
    z: number;
    size: number;
    born: number;
}

const pending: Burst[] = [];
const _o = new THREE.Object3D();
const _c = new THREE.Color();
const CORE = new THREE.Color( FRACTURE_CORE_HEX );
const GEOMETRY = new THREE.IcosahedronGeometry( 0.5, 2 );

export function queueBurst( x: number, y: number, z: number, size: number ): void {
    if ( pending.length < SLOTS ) pending.push( { x, y, z, size, born: -1 } );
}

function draw( mesh: THREE.InstancedMesh, live: Burst[], now: number ): void {
    const life = num( 'Break.flashLife' );
    const scale = num( 'Break.flashSize' );
    const bright = num( 'Break.flashBright' );
    let n = 0;
    for ( const b of live ) {
        const u = ( now - b.born ) / life;
        if ( u >= 1 ) continue;
        const s = b.size * scale * ( 0.35 + 0.65 * ( 1 - ( 1 - u ) * ( 1 - u ) ) );
        _o.position.set( b.x, b.y, b.z );
        _o.scale.setScalar( s );
        _o.updateMatrix();
        mesh.setMatrixAt( n, _o.matrix );
        const k = bright * ( 1 - u ) * ( 1 - u );
        mesh.setColorAt( n, _c.copy( CORE ).lerp( accent(), u ).multiplyScalar( k ) );
        live[ n ] = b;
        n++;
    }
    live.length = n;
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

export function BlockBurst() {
    const live = useMemo< Burst[] >( () => [], [] );
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    useFrame( ( state ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const now = state.clock.elapsedTime;
        for ( const b of pending ) {
            b.born = now;
            live.push( b );
            if ( live.length > SLOTS ) live.shift();
        }
        pending.length = 0;
        draw( mesh, live, now );
    } );

    return (
        <instancedMesh
            ref={ ( m ) => {
                meshRef.current = m;
                if ( m ) m.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
            } }
            geometry={ GEOMETRY }
            count={ 0 }
            frustumCulled={ false }
            args={ [ undefined, undefined, SLOTS ] }
        >
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } fog={ false } />
        </instancedMesh>
    );
}
