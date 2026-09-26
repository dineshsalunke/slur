import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { advanceShards, initShardMesh, makeShardPool, type ShardSpec, spawnBurst } from './vfx-shard-pool';

const SPEC: ShardSpec = {
    max: 12,
    perBurst: 4,
    lifeMin: 0.2,
    lifeMax: 0.2,
    speed: 1,
    upBias: 0,
    drag: 0,
    grav: 0,
};

function setup() {
    const pool = makeShardPool( SPEC );
    const mesh = new THREE.InstancedMesh( new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), SPEC.max );
    initShardMesh( mesh, pool );
    const placed: number[] = [];
    const place = ( _m: THREE.InstancedMesh, i: number ) => {
        placed.push( i );
    };
    return { pool, mesh, placed, place };
}

describe( 'vfx shard pool', () => {
    it( 'starts with nothing drawn', () => {
        const { mesh } = setup();
        expect( mesh.count ).toBe( 0 );
        expect( mesh.instanceColor ).not.toBeNull();
    } );

    it( 'draws up to the highest live shard only', () => {
        const { pool, mesh, placed, place } = setup();
        spawnBurst( pool, 0, 0, 0 );
        spawnBurst( pool, 0, 0, 0 );
        advanceShards( pool, mesh, 0.01, place );
        expect( mesh.count ).toBe( 8 );
        expect( placed ).toEqual( [ 0, 1, 2, 3, 4, 5, 6, 7 ] );
    } );

    it( 'drops the count to zero when the burst dies, then stops uploading', () => {
        const { pool, mesh, place } = setup();
        spawnBurst( pool, 0, 0, 0 );
        advanceShards( pool, mesh, 0.01, place );
        advanceShards( pool, mesh, 1, place );
        expect( mesh.count ).toBe( 0 );

        const version = mesh.instanceMatrix.version;
        advanceShards( pool, mesh, 1 / 60, place );
        expect( mesh.instanceMatrix.version ).toBe( version );
    } );

    it( 'caps a burst at the pool size', () => {
        const { pool, mesh, place } = setup();
        for ( let i = 0; i < 5; i++ ) spawnBurst( pool, 0, 0, 0 );
        advanceShards( pool, mesh, 0.01, place );
        expect( mesh.count ).toBe( SPEC.max );
    } );
} );
