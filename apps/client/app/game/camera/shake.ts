import type { PerspectiveCamera } from 'three';
import { num } from '../../dev/tuning';

const DECAY = 1.4;
const PITCH = 0.028;
const YAW = 0.02;
const ROLL = 0.036;
const RATE = 1;

let trauma = 0;
let clock = 0;
let camX = 0;
let camY = 0;
let camZ = 0;

export function shake( amount: number ): void {
    trauma = Math.min( 1, trauma + amount );
}

export function shakeFrom( x: number, y: number, z: number, amount: number, reach: number ): void {
    const d = Math.hypot( x - camX, y - camY, z - camZ );
    shake( amount / ( 1 + ( d / reach ) * ( d / reach ) ) );
}

function wobble( t: number, k: number ): number {
    return (
        Math.sin( t * 31.7 + k * 1.9 ) * 0.55 + Math.sin( t * 19.3 + k * 4.3 ) * 0.3 + Math.sin( t * 53.1 + k ) * 0.15
    );
}

export function applyShake( cam: PerspectiveCamera, dt: number ): void {
    camX = cam.position.x;
    camY = cam.position.y;
    camZ = cam.position.z;
    clock += dt * RATE;
    trauma = Math.max( 0, trauma - DECAY * dt );
    if ( trauma <= 0 ) return;
    const s = trauma * trauma * num( 'Shake.strength' );
    cam.rotateX( s * PITCH * wobble( clock, 1 ) );
    cam.rotateY( s * YAW * wobble( clock, 2 ) );
    cam.rotateZ( s * ROLL * wobble( clock, 3 ) );
}
