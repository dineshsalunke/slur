import { spawnShip } from '@slur/shared';
import { trait } from 'koota';
import * as THREE from 'three';

// AoS callback trait → a live SimShip reference (not a snapshot); stepShip mutates it in place.
export const Sim = trait( () => spawnShip() );

// Physics transform captured BEFORE the last step — the source we interpolate from (SoA scalars).
export const Prev = trait( { x: 0, y: 0, z: 0 } );

// AoS callback trait → the render node the ship mesh parents to; systems write its transform.
export const Render = trait( () => new THREE.Group() );

// Tag: this entity is the locally-controlled ship.
export const LocalPlayer = trait();
