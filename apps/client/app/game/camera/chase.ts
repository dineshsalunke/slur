import { DEFAULT_TUNING, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Group, PerspectiveCamera } from 'three';
import { LocalPlayer, Net, Remote, Render, Sim } from '../ecs/traits';

// Chase cam: behind + above the ship, rubberband follow (exp ease, frame-rate independent),
// speed-based trail stretch, look-ahead, and speed-FOV. Called from the Loop (no own useFrame),
// so R3F's auto-render stays on.
export function updateChaseCamera( cam: PerspectiveCamera, world: World, dt: number ): void {
    const e = world.queryFirst( LocalPlayer, Render, Sim );
    if ( ! e ) return;
    const render = e.get( Render );
    const sim = e.get( Sim );
    if ( ! render || ! sim ) return;
    const p = render.position;
    const speed = sim.vz;
    // Per-ship top speed so the speed-based framing normalises to THIS ship (solo has no Net → Fighter).
    const net = e.get( Net );
    const maxCruise = net ? tuningForShip( net.shipId ).maxCruise : DEFAULT_TUNING.maxCruise;

    const k = 1 - Math.exp( -16 * dt ); // rubberband lag-follow
    const back = 14 + ( speed / maxCruise ) * 3; // trail-stretch with speed

    cam.position.x += ( p.x - cam.position.x ) * k;
    // Sit ABOVE the 8u walls (BLOCK_HEIGHT) so you can SEE OVER the pillars and PLAN your line — a low chase
    // cam hides everything behind the nearest wall. Higher vantage + look further ahead and slightly down.
    cam.position.y += ( p.y + 9 - cam.position.y ) * k;
    cam.position.z += ( p.z - back - cam.position.z ) * k; // forward = +z, trail behind
    cam.lookAt( p.x, p.y + 0.5, p.z + 14 ); // look-ahead, angled down over the incoming field

    const fov = 70 + ( speed / maxCruise ) * 20;
    if ( Math.abs( cam.fov - fov ) > 0.1 ) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
    }
}

// Lobby hero-orbit: the "3D preview" is the REAL local ship on the start line (no 2nd Canvas). Picking a
// ship/colour swaps its model+tint live via the ECS bridge, so this is WYSIWYG. Slow orbit around the local
// player's Render group; module-level angle advanced by dt; rubberband ease; fixed cinematic FOV.
const LOBBY_FOV = 55;
const LOBBY_RADIUS = 8; // how far the camera sits from the ship (u)
const LOBBY_HEIGHT = 3; // how high above the ship (u)
const LOBBY_ORBIT_SPEED = 0.35; // rad/s
let orbitAngle = 0;

export function updateLobbyCamera( cam: PerspectiveCamera, world: World, dt: number ): void {
    const e = world.queryFirst( LocalPlayer, Render );
    if ( ! e ) return;
    const render = e.get( Render );
    if ( ! render ) return;
    const p = render.position;
    orbitAngle += dt * LOBBY_ORBIT_SPEED;

    const k = 1 - Math.exp( -6 * dt ); // gentler ease than the chase (cinematic, not reactive)
    const tx = p.x + Math.sin( orbitAngle ) * LOBBY_RADIUS;
    const ty = p.y + LOBBY_HEIGHT;
    const tz = p.z + Math.cos( orbitAngle ) * LOBBY_RADIUS;
    cam.position.x += ( tx - cam.position.x ) * k;
    cam.position.y += ( ty - cam.position.y ) * k;
    cam.position.z += ( tz - cam.position.z ) * k;
    cam.lookAt( p.x, p.y + 0.5, p.z );

    if ( Math.abs( cam.fov - LOBBY_FOV ) > 0.1 ) {
        cam.fov = LOBBY_FOV;
        cam.updateProjectionMatrix();
    }
}

// Spectator cam: follow a target racer's Render group (racers are Remote → already interpolated) with the same
// rubberband as the chase. Null/absent target → the leader (furthest z). No Sim needed — a spectator owns no
// moving ship, so speed-based framing is dropped for a fixed follow.
const SPECTATE_FOV = 78;
const SPECTATE_BACK = 12;

export function updateSpectatorCamera(
    cam: PerspectiveCamera,
    world: World,
    dt: number,
    targetSessionId: string | null,
): void {
    let target: Group | null = null;
    let leader: Group | null = null;
    let leaderZ = Number.NEGATIVE_INFINITY;
    for ( const e of world.query( Net, Render, Remote ) ) {
        const net = e.get( Net );
        const grp = e.get( Render );
        if ( ! net || ! grp ) continue;
        if ( net.sessionId === targetSessionId ) target = grp;
        if ( grp.position.z > leaderZ ) {
            leaderZ = grp.position.z;
            leader = grp;
        }
    }
    const grp = target ?? leader;
    if ( ! grp ) return;
    const p = grp.position;

    const k = 1 - Math.exp( -12 * dt );
    cam.position.x += ( p.x - cam.position.x ) * k;
    cam.position.y += ( p.y + 5 - cam.position.y ) * k;
    cam.position.z += ( p.z - SPECTATE_BACK - cam.position.z ) * k;
    cam.lookAt( p.x, p.y + 1, p.z + 8 );

    if ( Math.abs( cam.fov - SPECTATE_FOV ) > 0.1 ) {
        cam.fov = SPECTATE_FOV;
        cam.updateProjectionMatrix();
    }
}
