import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT } from './combat-look';

export const MAX_EMBERS = 384;
const PER_BOLT_FRAME = 3;
const LIFE_MIN = 0.18;
const LIFE_MAX = 0.5;
const SPREAD = 3.5;
const LIFT = 2.5;
const DRAG = 3;
const SIZE = 0.12;
const BRIGHT = 3;

const HOT = new THREE.Color( BOLT_HOT );
const _o = new THREE.Object3D();
const _c = new THREE.Color();

export interface EmberPool {
    x: Float32Array;
    y: Float32Array;
    z: Float32Array;
    vx: Float32Array;
    vy: Float32Array;
    vz: Float32Array;
    life: Float32Array;
    maxLife: Float32Array;
    cursor: number;
}

export function makeEmberPool(): EmberPool {
    return {
        x: new Float32Array( MAX_EMBERS ),
        y: new Float32Array( MAX_EMBERS ),
        z: new Float32Array( MAX_EMBERS ),
        vx: new Float32Array( MAX_EMBERS ),
        vy: new Float32Array( MAX_EMBERS ),
        vz: new Float32Array( MAX_EMBERS ),
        life: new Float32Array( MAX_EMBERS ),
        maxLife: new Float32Array( MAX_EMBERS ).fill( 1 ),
        cursor: 0,
    };
}

export function shedEmbers( pool: EmberPool, x: number, y: number, z: number, span: number ): void {
    for ( let n = 0; n < PER_BOLT_FRAME; n++ ) {
        const i = pool.cursor;
        pool.cursor = ( i + 1 ) % MAX_EMBERS;
        pool.x[ i ] = x + ( Math.random() - 0.5 ) * 0.3;
        pool.y[ i ] = y + ( Math.random() - 0.5 ) * 0.3;
        pool.z[ i ] = z - Math.random() * span;
        pool.vx[ i ] = ( Math.random() - 0.5 ) * SPREAD * 2;
        pool.vy[ i ] = Math.random() * LIFT;
        pool.vz[ i ] = ( Math.random() - 0.5 ) * SPREAD;
        pool.maxLife[ i ] = pool.life[ i ] = LIFE_MIN + Math.random() * ( LIFE_MAX - LIFE_MIN );
    }
}

export function advanceEmbers( mesh: THREE.InstancedMesh, pool: EmberPool, dt: number ): void {
    const damp = Math.max( 0, 1 - DRAG * dt );
    const cool = accent();
    for ( let i = 0; i < MAX_EMBERS; i++ ) {
        if ( pool.life[ i ] <= 0 ) {
            _o.scale.setScalar( 0 );
            _o.updateMatrix();
            mesh.setMatrixAt( i, _o.matrix );
            continue;
        }
        pool.life[ i ] -= dt;
        pool.vx[ i ] *= damp;
        pool.vy[ i ] *= damp;
        pool.vz[ i ] *= damp;
        pool.x[ i ] += pool.vx[ i ] * dt;
        pool.y[ i ] += pool.vy[ i ] * dt;
        pool.z[ i ] += pool.vz[ i ] * dt;
        const f = Math.max( 0, pool.life[ i ] / pool.maxLife[ i ] );
        _o.position.set( pool.x[ i ], pool.y[ i ], pool.z[ i ] );
        _o.scale.setScalar( SIZE * ( 0.3 + 0.7 * f ) );
        _o.updateMatrix();
        mesh.setMatrixAt( i, _o.matrix );
        const b = BRIGHT * f * f;
        _c.copy( cool )
            .lerp( HOT, f * f )
            .multiplyScalar( b );
        mesh.setColorAt( i, _c );
    }
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}
