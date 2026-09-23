import type { SimConfig } from '../sim-config.js';

interface Trail {
    zs: number[];
    xs: number[];
    head: number;
}

interface Point {
    x: number;
    z: number;
}

const trails = new WeakMap< object, Trail >();

export function forgetTrail( seeker: object ): void {
    trails.delete( seeker );
}

export function recordTrail( seeker: object & Point, target: Point, cfg: SimConfig ): void {
    const trail = trails.get( seeker );
    if ( ! trail ) {
        trails.set( seeker, { zs: [ seeker.z, target.z ], xs: [ seeker.x, target.x ], head: 0 } );
        return;
    }
    const last = trail.zs.length - 1;
    if ( target.z - trail.zs[ last ] < cfg.seekerTrailStep ) return;
    if ( trail.zs.length - trail.head >= cfg.seekerTrailLen ) {
        trail.zs[ last ] = target.z;
        trail.xs[ last ] = target.x;
        return;
    }
    trail.zs.push( target.z );
    trail.xs.push( target.x );
}

export function trailX( seeker: object & Point ): number {
    const trail = trails.get( seeker );
    if ( ! trail ) return seeker.x;
    const { zs, xs } = trail;
    while ( trail.head + 1 < zs.length && zs[ trail.head + 1 ] <= seeker.z ) trail.head++;
    if ( trail.head > zs.length / 2 ) {
        zs.splice( 0, trail.head );
        xs.splice( 0, trail.head );
        trail.head = 0;
    }
    const i = trail.head;
    if ( i + 1 >= zs.length ) return xs[ i ];
    const t = Math.max( 0, ( seeker.z - zs[ i ] ) / ( zs[ i + 1 ] - zs[ i ] ) );
    return xs[ i ] + ( xs[ i + 1 ] - xs[ i ] ) * t;
}
