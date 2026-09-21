import { DEFAULT_SHIP, spawnShip } from '@slur/shared';
import { trait } from 'koota';
import * as THREE from 'three';

export const Sim = trait( () => spawnShip() );

export const Prev = trait( { x: 0, y: 0, z: 0 } );

export const Render = trait( () => new THREE.Group() );

export const LocalPlayer = trait();

export const Net = trait( { sessionId: '', shipId: DEFAULT_SHIP as string, colorId: 0 } );

export const Remote = trait();

export interface Snapshot {
    t: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    dead: boolean;
    stunned: boolean;
}
export const Interp = trait( () => ( { buffer: [] as Snapshot[] } ) );

export const NetProjectile = trait();

export interface ProjSnapshot {
    t: number;
    x: number;
    y: number;
    z: number;
}
export const ProjInterp = trait( () => ( { buffer: [] as ProjSnapshot[] } ) );
