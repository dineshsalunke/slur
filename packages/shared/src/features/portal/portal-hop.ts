import { DEFAULT_PORTAL_CONFIG, type PortalConfig } from './portal-constants.js';

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

function crossed( prevZ: number, z: number, plane: number ): boolean {
    return ( prevZ < plane && z >= plane ) || ( prevZ > plane && z <= plane );
}

export function portalHalfChord( dy: number, cfg: PortalConfig = DEFAULT_PORTAL_CONFIG ): number {
    const r2 = cfg.portalR * cfg.portalR - dy * dy;
    return r2 > 0 ? Math.sqrt( r2 ) : -1;
}

function enters( s: PortalRider, prevZ: number, halfW: number, x: number, y: number, z: number, cfg: PortalConfig ) {
    if ( ! crossed( prevZ, s.z, z ) ) return false;
    const chord = portalHalfChord( s.y + cfg.portalRideY - y - cfg.portalY, cfg );
    return chord >= 0 && Math.abs( s.x - x ) < chord + halfW;
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
