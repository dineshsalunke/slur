import { DEFAULT_TUNING, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Group, PerspectiveCamera } from 'three';
import { LocalPlayer, Net, Remote, Render, Sim } from '../ecs/traits';

// Chase-cam framing (live-tunable). The ship is small on screen when the cam is high, far back, wide-FOV,
// AND aimed far ahead — all four compound. These knobs trade "ship reads big/centred" against "see over the
// 8u pillars to plan your line" (ADR-006). Height stays ABOVE BLOCK_HEIGHT (8u) so the see-over vantage is
// kept; the ship is pulled bigger via the other three levers (closer aim, tighter FOV, shorter trail).
const CHASE = {
    height: 9, // u above the ship — MUST stay > BLOCK_HEIGHT (8) or the nearest pillar hides the field
    back: 11, // u behind at rest (was 14 — closer ⇒ ship bigger)
    backStretch: 3, // extra u of trail at top speed (back += speed/maxCruise · this)
    lookAhead: 7, // u ahead of the ship the cam aims at (was 14 — nearer aim ⇒ ship centred + larger)
    lookAtLift: 2, // u above the ship the aim point sits (was 0.5 — lifts the horizon so the ship rides higher)
    fov: 60, // deg at rest (was 70 — tighter ⇒ ship bigger, less fish-eye)
    fovStretch: 15, // extra deg of FOV at top speed (speed-kick; was 20, now 60→75 instead of 70→90)
    follow: 16, // rubberband stiffness (exp ease, frame-rate independent)
};

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

    const k = 1 - Math.exp( -CHASE.follow * dt ); // rubberband lag-follow
    const back = CHASE.back + ( speed / maxCruise ) * CHASE.backStretch; // trail-stretch with speed

    cam.position.x += ( p.x - cam.position.x ) * k;
    cam.position.y += ( p.y + CHASE.height - cam.position.y ) * k;
    cam.position.z += ( p.z - back - cam.position.z ) * k; // forward = +z, trail behind
    cam.lookAt( p.x, p.y + CHASE.lookAtLift, p.z + CHASE.lookAhead ); // near-ahead aim, ship rides high in frame

    const fov = CHASE.fov + ( speed / maxCruise ) * CHASE.fovStretch;
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
