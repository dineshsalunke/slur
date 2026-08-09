import { DEFAULT_SHIP, spawnShip } from '@slur/shared';
import { trait } from 'koota';
import * as THREE from 'three';

// AoS callback trait → a live SimShip reference (not a snapshot); simulate() mutates it in place.
export const Sim = trait( () => spawnShip() );

// Physics transform captured BEFORE the last step — the source we interpolate from (SoA scalars).
export const Prev = trait( { x: 0, y: 0, z: 0 } );

// AoS callback trait → the render node the ship mesh parents to; systems write its transform.
export const Render = trait( () => new THREE.Group() );

// Tag: this entity is the locally-controlled ship.
export const LocalPlayer = trait();

// ── S2 networked traits ──

// Every networked ship (local + remote) carries its Colyseus sessionId — the reconciliation key
// mapping schema player → ECS entity — plus its chosen shipId. shipId resolves (via ship-classes.ts)
// to the FlightTuning the sim/camera/bank use and the model the view mounts. It's mirrored from the
// authoritative PlayerState ONLY when it actually changes (a class hot-swap), never per patch — so the
// ship view re-renders on a swap, not 20×/s. `colorId` (team-colour palette index) is mirrored the same
// change-gated way and drives the ship's tint via colors.ts.
export const Net = trait( { sessionId: '', shipId: DEFAULT_SHIP as string, colorId: 0 } );

// Tag: a remote (interpolated) ship. Remotes NEVER get Sim/Prev — they are never predicted, only
// eased toward buffered server snapshots (netcode "two reconciliations": predict local, interp remote).
export const Remote = trait();

// Per-remote snapshot ring buffer (AoS callback → a live object, not a snapshot). We push one entry
// per received patch and render ~RENDER_DELAY ms in the past by lerping between the two straddling it.
export interface Snapshot {
    t: number; // client receive time (performance.now), the interpolation clock
    x: number;
    y: number;
    z: number;
    vx: number; // for the cosmetic bank
    dead: boolean; // derezzed on the server → hide/ghost the remote ship (S3)
}
export const Interp = trait( () => ( { buffer: [] as Snapshot[] } ) );
