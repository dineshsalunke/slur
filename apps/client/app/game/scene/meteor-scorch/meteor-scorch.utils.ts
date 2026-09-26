import * as THREE from 'three';
import { accent } from '../accent';
import type { Mark } from './meteor-scorch';
import {
    _c,
    _o,
    CORE,
    EMBER_END,
    FLASH,
    FLASH_SHARE,
    FLICKER,
    LIFT,
    LIMIT,
    QUEUE,
    SPREAD,
} from './meteor-scorch.constants';
import { pending } from './meteor-scorch.state';

export function queueScorch( x: number, y: number, z: number, size: number, turn: number ): void {
    if ( pending.length < QUEUE ) pending.push( { x, y, z, size, turn } );
}

export function flatPlane(): THREE.PlaneGeometry {
    const g = new THREE.PlaneGeometry( 1, 1 );
    g.rotateX( -Math.PI / 2 );
    return g;
}

export function stamp( marks: Mark[], cursor: number, now: number ): number {
    let next = cursor;
    for ( const p of pending ) {
        const m = marks[ next ];
        next = ( next + 1 ) % LIMIT;
        Object.assign( m, p );
        m.born = now;
        m.live = true;
    }
    pending.length = 0;
    return next;
}

export function place( m: Mark ): void {
    _o.position.set( m.x, m.y + LIFT, m.z );
    _o.rotation.set( 0, m.turn, 0 );
    _o.scale.setScalar( m.live ? m.size * SPREAD : 0 );
    _o.updateMatrix();
}

export function emberColor( age: number, i: number, gain: number, cool: number ): THREE.Color {
    if ( age >= EMBER_END ) return _c.setRGB( 0, 0, 0 );
    const flash = Math.exp( -age / FLASH );
    const fade = 1 - age / EMBER_END;
    const k =
        gain *
        fade *
        fade *
        ( 1 - FLASH_SHARE + FLASH_SHARE * flash ) *
        Math.exp( -age / cool ) *
        ( 1 + FLICKER * Math.sin( age * 23 + i * 5.1 ) );
    return _c.copy( accent() ).lerp( CORE, flash ).multiplyScalar( k );
}
