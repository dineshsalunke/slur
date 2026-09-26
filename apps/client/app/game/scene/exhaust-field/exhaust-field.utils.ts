import type { Entity } from 'koota';
import type * as THREE from 'three';
import { col, num } from '../../../dev/tuning';
import { Net, Render } from '../../ecs/traits';
import { exhaustDrive } from '../exhaust-drive';
import { exhaustPorts } from '../exhaust-ports';
import type { Palette } from './exhaust-field';
import { _instance, _port, _ship, MAX_PLUMES, SPREAD_AT_IDLE } from './exhaust-field.constants';

export function syncPalette( material: THREE.ShaderMaterial, applied: Palette ): void {
    const hot = col( 'Exhaust.hot' );
    if ( hot !== applied.hot ) {
        ( material.uniforms.uHot.value as THREE.Color ).set( hot );
        applied.hot = hot;
    }
    const cool = col( 'Exhaust.cool' );
    if ( cool !== applied.cool ) {
        ( material.uniforms.uCool.value as THREE.Color ).set( cool );
        applied.cool = cool;
    }
    material.uniforms.uSoftness.value = num( 'Exhaust.softness' );
    material.uniforms.uFalloff.value = num( 'Exhaust.falloff' );
    material.uniforms.uHeat.value = num( 'Exhaust.heat' );
}

export function writeShip( mesh: THREE.InstancedMesh, drive: Float32Array, at: number, entity: Entity ): number {
    const group = entity.get( Render );
    const net = entity.get( Net );
    if ( ! group || ! net || ! group.visible ) return 0;

    const ports = exhaustPorts( net.shipId );
    if ( ! ports || at + ports.length > MAX_PLUMES ) return 0;

    const throttle = exhaustDrive( entity );
    if ( throttle < 0 ) return 0;

    const idle = num( 'Exhaust.idle' );
    const ramp = idle + ( 1 - idle ) * throttle;
    const stretch = num( 'Exhaust.length' ) * ramp;
    const widen = num( 'Exhaust.spread' ) * ( SPREAD_AT_IDLE + ( 1 - SPREAD_AT_IDLE ) * throttle );
    const brightness = num( 'Exhaust.glow' ) * ramp;

    _ship.compose( group.position, group.quaternion, group.scale );
    for ( let p = 0; p < ports.length; p++ ) {
        const port = ports[ p ];
        _port.makeTranslation( port.x, port.y, port.z );
        _instance.multiplyMatrices( _ship, _port );
        mesh.setMatrixAt( at + p, _instance );
        drive[ ( at + p ) * 3 ] = stretch;
        drive[ ( at + p ) * 3 + 1 ] = widen;
        drive[ ( at + p ) * 3 + 2 ] = brightness;
    }
    return ports.length;
}
