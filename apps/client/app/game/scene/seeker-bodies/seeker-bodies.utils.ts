import * as THREE from 'three';
import { accent } from '../accent';
import {
    SEEKER_FLIGHT,
    SEEKER_TRAIL_BRIGHT,
    SEEKER_TRAIL_HEAT,
    SEEKER_TRAIL_WIDTH,
    seekerTail,
    seekerTrailSegmentGeometry,
} from '../seeker-look';
import { buildSeekerBody } from '../seeker-pickups/seeker-pickups.utils';
import { type SeekerTrailRing, TRAIL_POINTS, trailIndex } from '../seeker-trail';
import type { Frame } from './seeker-bodies';
import { _c, _dir, _o, FORWARD, HOT, MAX_SEGMENTS } from './seeker-bodies.constants';

export function buildLook() {
    return {
        body: buildSeekerBody(),
        segmentGeo: seekerTrailSegmentGeometry(),
        trail: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } ),
        emberGeo: new THREE.OctahedronGeometry( 1, 0 ),
        ember: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } ),
    };
}

export function writeSegment(
    frame: Frame,
    mesh: THREE.InstancedMesh,
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    fade: number,
): void {
    _dir.set( bx - ax, by - ay, bz - az );
    const len = _dir.length();
    if ( len < 1e-3 || frame.segments >= MAX_SEGMENTS ) return;
    _dir.divideScalar( len );
    const w = SEEKER_TRAIL_WIDTH * fade * fade;
    _o.position.set( ax, ay, az );
    _o.quaternion.setFromUnitVectors( FORWARD, _dir );
    _o.scale.set( w, w, len );
    _o.updateMatrix();
    mesh.setMatrixAt( frame.segments, _o.matrix );
    _c.copy( accent() )
        .lerp( HOT, SEEKER_TRAIL_HEAT * fade * fade )
        .multiplyScalar( SEEKER_TRAIL_BRIGHT * fade * fade );
    mesh.setColorAt( frame.segments, _c );
    frame.segments++;
}

export function writeTrail(
    frame: Frame,
    mesh: THREE.InstancedMesh,
    x: number,
    y: number,
    z: number,
    r: SeekerTrailRing,
) {
    const tail = seekerTail( SEEKER_FLIGHT );
    let px = x - r.hx * tail;
    let py = y - r.hy * tail;
    let pz = z - r.hz * tail;
    let first = -1;
    for ( let k = 0; k < r.count; k++ ) {
        const i = trailIndex( r, k );
        const qx = r.x[ i ];
        const qy = r.y[ i ];
        const qz = r.z[ i ];
        if ( first < 0 && ( qx - px ) * r.hx + ( qy - py ) * r.hy + ( qz - pz ) * r.hz >= 0 ) continue;
        if ( first < 0 ) first = k;
        writeSegment( frame, mesh, px, py, pz, qx, qy, qz, 1 - ( k - first ) / ( TRAIL_POINTS - first ) );
        px = qx;
        py = qy;
        pz = qz;
    }
}
