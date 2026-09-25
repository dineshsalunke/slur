import { DEFAULT_SHIP, emptySlots, spawnShip } from '@slur/shared';
import { trait } from 'koota';
import * as THREE from 'three';
import { makeSeekerTrail } from '../scene/seeker-trail';

export const Sim = trait( () => spawnShip() );

export const Prev = trait( { x: 0, y: 0, z: 0 } );

export const Render = trait( () => new THREE.Group() );

export const Hover = trait( () => ( { lift: 0, phase: Math.random() * Math.PI * 2, applied: 0 } ) );

export const Attitude = trait( () => ( { roll: 0, rollVel: 0, yaw: 0, yawVel: 0, pitch: 0, pitchVel: 0 } ) );

export const LocalPlayer = trait();

export const Held = trait( () => ( { slots: emptySlots() } ) );

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

export const NetSeeker = trait( { ownerId: '', targetId: '' } );

export const SeekerTrail = trait( makeSeekerTrail );
