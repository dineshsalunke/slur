import { DEFAULT_TUNING, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Group, PerspectiveCamera } from 'three';
import { LocalPlayer, Net, Remote, Render, Sim } from '../ecs/traits';

const CHASE_BACK = 12;
const CHASE_BACK_STRETCH = 0;
const CHASE_HEIGHT = 5;
const CHASE_LOOK_AHEAD = 14;
const CHASE_LOOK_AT_LIFT = 1;
const CHASE_FOV = 70;
const CHASE_FOV_STRETCH = 0;
const CHASE_FOLLOW = 20;

let followBack = CHASE_BACK;

export function updateChaseCamera( cam: PerspectiveCamera, world: World, dt: number ): void {
    const e = world.queryFirst( LocalPlayer, Render, Sim );
    if ( ! e ) return;
    const render = e.get( Render );
    const sim = e.get( Sim );
    if ( ! render || ! sim ) return;
    const p = render.position;
    const speed = sim.vz;
    const net = e.get( Net );
    const maxCruise = net ? tuningForShip( net.shipId ).maxCruise : DEFAULT_TUNING.maxCruise;

    const stretch = speed / maxCruise;

    const k = 1 - Math.exp( -CHASE_FOLLOW * dt );
    const back = CHASE_BACK + stretch * CHASE_BACK_STRETCH;
    followBack += ( back - followBack ) * k;

    cam.position.x = p.x;
    cam.position.y += ( p.y + CHASE_HEIGHT - cam.position.y ) * k;
    cam.position.z = p.z - followBack;
    cam.lookAt( p.x, p.y + CHASE_LOOK_AT_LIFT, p.z + CHASE_LOOK_AHEAD );

    const fov = CHASE_FOV + stretch * CHASE_FOV_STRETCH;
    if ( Math.abs( cam.fov - fov ) > 0.1 ) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
    }
}

const LOBBY_FOV = 55;
const LOBBY_RADIUS = 8;
const LOBBY_HEIGHT = 3;
const LOBBY_ORBIT_SPEED = 0.35;
let orbitAngle = 0;

export function updateLobbyCamera( cam: PerspectiveCamera, world: World, dt: number ): void {
    const e = world.queryFirst( LocalPlayer, Render );
    if ( ! e ) return;
    const render = e.get( Render );
    if ( ! render ) return;
    const p = render.position;
    orbitAngle += dt * LOBBY_ORBIT_SPEED;

    const k = 1 - Math.exp( -6 * dt );
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
