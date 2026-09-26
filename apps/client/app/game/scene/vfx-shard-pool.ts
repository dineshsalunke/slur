import * as THREE from 'three';

export interface ShardSpec {
    max: number;
    perBurst: number;
    lifeMin: number;
    lifeMax: number;
    speed: number;
    upBias: number;
    drag: number;
    grav: number;
}

export interface Shard {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    r: number;
    g: number;
    b: number;
}

export interface ShardPool {
    spec: ShardSpec;
    shards: Shard[];
    top: number;
}

export type PlaceShard = ( mesh: THREE.InstancedMesh, i: number, shard: Shard, f: number ) => void;

const _park = new THREE.Object3D();
const _black = new THREE.Color( 0, 0, 0 );

export function makeShardPool( spec: ShardSpec ): ShardPool {
    const shards = Array.from( { length: spec.max }, () => ( {
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        r: 0,
        g: 0,
        b: 0,
    } ) );
    return { spec, shards, top: 0 };
}

export function spawnBurst( pool: ShardPool, x: number, y: number, z: number, tint?: THREE.Color ): void {
    const { spec, shards } = pool;
    let n = 0;
    for ( let i = 0; i < spec.max && n < spec.perBurst; i++ ) {
        const p = shards[ i ];
        if ( p.active ) continue;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos( 2 * Math.random() - 1 );
        const speed = spec.speed * ( 0.5 + Math.random() );
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = Math.sin( phi ) * Math.cos( theta ) * speed;
        p.vz = Math.sin( phi ) * Math.sin( theta ) * speed;
        p.vy = Math.cos( phi ) * speed + spec.upBias;
        p.maxLife = p.life = spec.lifeMin + Math.random() * ( spec.lifeMax - spec.lifeMin );
        if ( tint ) {
            p.r = tint.r;
            p.g = tint.g;
            p.b = tint.b;
        }
        pool.top = Math.max( pool.top, i + 1 );
        n++;
    }
}

function park( mesh: THREE.InstancedMesh, i: number ): void {
    _park.position.set( 0, -9999, 0 );
    _park.scale.set( 0, 0, 0 );
    _park.updateMatrix();
    mesh.setMatrixAt( i, _park.matrix );
}

export function initShardMesh( mesh: THREE.InstancedMesh, pool: ShardPool ): void {
    for ( let i = 0; i < pool.spec.max; i++ ) {
        park( mesh, i );
        mesh.setColorAt( i, _black );
    }
    mesh.count = 0;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

export function advanceShards( pool: ShardPool, mesh: THREE.InstancedMesh, dt: number, place: PlaceShard ): void {
    const { spec, shards } = pool;
    const damp = Math.max( 0, 1 - spec.drag * dt );
    let top = 0;
    for ( let i = 0; i < pool.top; i++ ) {
        const p = shards[ i ];
        if ( ! p.active ) continue;
        p.life -= dt;
        if ( p.life <= 0 ) {
            p.active = false;
            park( mesh, i );
            continue;
        }
        p.vy -= spec.grav * dt;
        p.vx *= damp;
        p.vy *= damp;
        p.vz *= damp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        place( mesh, i, p, p.life / p.maxLife );
        top = i + 1;
    }
    pool.top = top;
    if ( top === 0 && mesh.count === 0 ) return;
    mesh.count = top;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}
