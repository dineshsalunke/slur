import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { accent } from '../accent';
import type { Burst } from './block-burst';
import { _c, _o, CORE, SLOTS } from './block-burst.constants';
import { pending } from './block-burst.state';

export function queueBurst( x: number, y: number, z: number, size: number ): void {
    if ( pending.length < SLOTS ) pending.push( { x, y, z, size, born: -1 } );
}

export function draw( mesh: THREE.InstancedMesh, live: Burst[], now: number ): void {
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
