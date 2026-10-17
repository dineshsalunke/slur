import type { FireDir } from '../../combat/fire-dir.js';
import { intersectRuns, type Run } from '../../sim/clearance.js';
import { HALF_WIDTH, type Segment, spanZ0, spanZ1, type Track } from '../../sim/space.js';
import { DEFAULT_PORTAL_CONFIG, type PortalConfig } from './portal-constants.js';
import type { PortalSpot } from './portal-hop.js';

export interface PortalPlacer {
    x: number;
    z: number;
    vz: number;
}

export interface PortalHull {
    halfL: number;
    maxCruise: number;
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
