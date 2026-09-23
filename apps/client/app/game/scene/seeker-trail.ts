export const TRAIL_POINTS = 12;
export const TRAIL_SPACING = 2;
const HEADING_MIN = 0.25;

export interface SeekerTrailRing {
    x: Float32Array;
    y: Float32Array;
    z: Float32Array;
    head: number;
    count: number;
    hx: number;
    hy: number;
    hz: number;
}

export function makeSeekerTrail(): SeekerTrailRing {
    return {
        x: new Float32Array( TRAIL_POINTS ),
        y: new Float32Array( TRAIL_POINTS ),
        z: new Float32Array( TRAIL_POINTS ),
        head: 0,
        count: 0,
        hx: 0,
        hy: 0,
        hz: 1,
    };
}

function record( r: SeekerTrailRing, x: number, y: number, z: number ): void {
    const next = r.count === 0 ? 0 : ( r.head + 1 ) % TRAIL_POINTS;
    r.x[ next ] = x;
    r.y[ next ] = y;
    r.z[ next ] = z;
    r.head = next;
    r.count = Math.min( TRAIL_POINTS, r.count + 1 );
}

export function advanceSeekerTrail( r: SeekerTrailRing, x: number, y: number, z: number ): void {
    if ( r.count === 0 ) {
        record( r, x, y, z );
        return;
    }
    const dx = x - r.x[ r.head ];
    const dy = y - r.y[ r.head ];
    const dz = z - r.z[ r.head ];
    const d = Math.hypot( dx, dy, dz );
    if ( d >= HEADING_MIN ) {
        r.hx = dx / d;
        r.hy = dy / d;
        r.hz = dz / d;
    }
    if ( d >= TRAIL_SPACING ) record( r, x, y, z );
}

export function trailIndex( r: SeekerTrailRing, back: number ): number {
    return ( r.head - back + TRAIL_POINTS ) % TRAIL_POINTS;
}
