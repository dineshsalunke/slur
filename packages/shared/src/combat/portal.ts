import { MAX_SHIP_WIDTH } from '../constants.js';
import { intersectRuns, type Run } from '../sim/clearance.js';
import { HALF_WIDTH, type Segment, spanZ0, spanZ1, type Track } from '../sim/space.js';
import type { FireDir } from './fire-dir.js';

export interface PortalConfig {
    portalR: number;
    portalH: number;
    portalNearLeadS: number;
    portalFarS: number;
    portalBackGap: number;
    portalArmS: number;
    portalTtl: number;
    portalDoubleTapTicks: number;
    portalClearW: number;
    portalClearHalfL: number;
    portalExitGap: number;
    portalFinishGap: number;
    portalZStep: number;
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
    portalR: 3,
    portalH: 5,
    portalNearLeadS: 0.4,
    portalFarS: 1,
    portalBackGap: 1,
    portalArmS: 0.3,
    portalTtl: 9,
    portalDoubleTapTicks: 15,
    portalClearW: MAX_SHIP_WIDTH + 3,
    portalClearHalfL: 6,
    portalExitGap: 0.5,
    portalFinishGap: 20,
    portalZStep: 1,
};

export interface PortalSpot {
    x: number;
    y: number;
    z: number;
}

export interface PortalState {
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    ends: number;
    armA: boolean;
    armB: boolean;
}

export interface PortalPlacer {
    x: number;
    z: number;
    vz: number;
}

export interface PortalHull {
    halfL: number;
    maxCruise: number;
}

export interface PortalRider {
    x: number;
    y: number;
    z: number;
    vz: number;
    dead: boolean;
    finished: boolean;
    lastSafeX: number;
    lastSafeZ: number;
    portalHops: number;
}

export function portalReach( hull: PortalHull, cfg: PortalConfig, dir: FireDir ): number {
    return hull.halfL + cfg.portalR + ( dir < 0 ? cfg.portalBackGap : 0 );
}

export function portalTargetZ(
    ship: PortalPlacer,
    hull: PortalHull,
    far: boolean,
    dir: FireDir,
    cfg: PortalConfig = DEFAULT_PORTAL_CONFIG,
): number {
    const reach = portalReach( hull, cfg, dir );
    if ( far ) return ship.z + dir * ( reach + hull.maxCruise * cfg.portalFarS );
    if ( dir < 0 ) return ship.z - reach;
    return ship.z + reach + Math.max( 0, ship.vz ) * cfg.portalNearLeadS;
}

function segsOver( track: Track, lo: number, hi: number ): Segment[] {
    const a = track.segmentAtZ( lo );
    const b = track.segmentAtZ( hi );
    return a.index === b.index ? [ a ] : [ a, b ];
}

function floorRuns( seg: Segment, lo: number, hi: number, half: number ): Run[] {
    const zLo = Math.max( lo, seg.z0 );
    const zHi = Math.min( hi, seg.z1 );
    const runs: Run[] = [];
    for ( const f of seg.floors ) {
        if ( spanZ0( seg, f ) > zLo + 1e-4 || spanZ1( seg, f ) < zHi - 1e-4 ) continue;
        if ( f.x1 - f.x0 >= 2 * half ) runs.push( [ f.x0 + half, f.x1 - half ] );
    }
    return runs;
}

function subtractRun( runs: Run[], cut: Run ): Run[] {
    const out: Run[] = [];
    for ( const [ r0, r1 ] of runs ) {
        if ( cut[ 1 ] <= r0 || cut[ 0 ] >= r1 ) {
            out.push( [ r0, r1 ] );
            continue;
        }
        if ( cut[ 0 ] > r0 ) out.push( [ r0, cut[ 0 ] ] );
        if ( cut[ 1 ] < r1 ) out.push( [ cut[ 1 ], r1 ] );
    }
    return out;
}

function floorYAt( seg: Segment, x: number, z: number ): number | null {
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( z < spanZ0( seg, f ) - 1e-4 || z > spanZ1( seg, f ) + 1e-4 || x < f.x0 || x > f.x1 ) continue;
        if ( best === null || f.y > best ) best = f.y;
    }
    return best;
}

export function clearRunsAt(
    track: Track,
    broken: ReadonlySet< number >,
    z: number,
    cfg: PortalConfig = DEFAULT_PORTAL_CONFIG,
): Run[] {
    const half = cfg.portalClearW / 2;
    const lo = z - cfg.portalClearHalfL;
    const hi = z + cfg.portalClearHalfL;
    const segs = segsOver( track, lo, hi );
    let runs: Run[] = [ [ -HALF_WIDTH + half, HALF_WIDTH - half ] ];
    for ( const seg of segs ) runs = intersectRuns( runs, floorRuns( seg, lo, hi, half ) );
    for ( const seg of segs ) {
        for ( const b of seg.blocks ) {
            if ( broken.has( b.id ) || b.z1 <= lo || b.z0 >= hi ) continue;
            runs = subtractRun( runs, [ b.x0 - half, b.x1 + half ] );
        }
    }
    return runs;
}

function nearestIn( runs: Run[], x: number ): number | null {
    let best: number | null = null;
    for ( const [ r0, r1 ] of runs ) {
        const c = Math.min( Math.max( x, r0 ), r1 );
        if ( best === null || Math.abs( c - x ) < Math.abs( best - x ) ) best = c;
    }
    return best;
}

export function clearSpotAt(
    track: Track,
    broken: ReadonlySet< number >,
    x: number,
    z: number,
    cfg: PortalConfig = DEFAULT_PORTAL_CONFIG,
): PortalSpot | null {
    const cx = nearestIn( clearRunsAt( track, broken, z, cfg ), x );
    if ( cx === null ) return null;
    const y = floorYAt( track.segmentAtZ( z ), cx, z );
    return y === null ? null : { x: cx, y, z };
}

export function placePortalEnd(
    ship: PortalPlacer,
    hull: PortalHull,
    far: boolean,
    dir: FireDir,
    track: Track,
    broken: ReadonlySet< number >,
    cfg: PortalConfig = DEFAULT_PORTAL_CONFIG,
): PortalSpot | null {
    const zMin = cfg.portalClearHalfL;
    const zMax = track.finishZ - cfg.portalFinishGap;
    const nearest = ship.z + dir * portalReach( hull, cfg, dir );
    let z = Math.min( Math.max( portalTargetZ( ship, hull, far, dir, cfg ), zMin ), zMax );
    while ( dir * ( z - nearest ) >= -1e-6 ) {
        const spot = clearSpotAt( track, broken, ship.x, z, cfg );
        if ( spot ) return spot;
        z -= dir * cfg.portalZStep;
    }
    return null;
}

function crossed( prevZ: number, z: number, plane: number ): boolean {
    return ( prevZ < plane && z >= plane ) || ( prevZ > plane && z <= plane );
}

function enters( s: PortalRider, prevZ: number, halfW: number, x: number, y: number, z: number, cfg: PortalConfig ) {
    return crossed( prevZ, s.z, z ) && Math.abs( s.x - x ) < cfg.portalR + halfW && s.y - y < cfg.portalH;
}

function exitAt( s: PortalRider, halfL: number, from: PortalSpot, to: PortalSpot, cfg: PortalConfig ): void {
    const sign = s.vz >= 0 ? 1 : -1;
    s.y = to.y + Math.max( 0, s.y - from.y );
    s.x = to.x;
    s.z = to.z + sign * ( cfg.portalR + halfL + cfg.portalExitGap );
    s.lastSafeX = to.x;
    s.lastSafeZ = to.z;
    s.portalHops = ( s.portalHops + 1 ) & 0xff;
}

export function hopThroughPortal(
    s: PortalRider,
    prevZ: number,
    hull: { halfW: number; halfL: number },
    portals: Iterable< PortalState >,
    cfg: PortalConfig = DEFAULT_PORTAL_CONFIG,
): boolean {
    if ( s.dead || s.finished ) return false;
    for ( const p of portals ) {
        if ( p.ends < 2 ) continue;
        const a = { x: p.ax, y: p.ay, z: p.az };
        const b = { x: p.bx, y: p.by, z: p.bz };
        if ( p.armA && enters( s, prevZ, hull.halfW, a.x, a.y, a.z, cfg ) ) {
            exitAt( s, hull.halfL, a, b, cfg );
            return true;
        }
        if ( p.armB && enters( s, prevZ, hull.halfW, b.x, b.y, b.z, cfg ) ) {
            exitAt( s, hull.halfL, b, a, cfg );
            return true;
        }
    }
    return false;
}
