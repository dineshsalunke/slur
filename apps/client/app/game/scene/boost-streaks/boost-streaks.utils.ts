import { DEFAULT_SIM_CONFIG, tuningForShip } from '@slur/shared';
import type { Entity } from 'koota';
import type * as THREE from 'three';
import { Interp, Net, Render, Sim } from '../../ecs/traits';
import { BOOST_STREAK_LENGTH, BOOST_STREAK_LIFT, BOOST_STREAK_SPREAD, BOOST_STREAK_WIDTH } from '../boost-look';
import { _identity, _instance, _local, _offset, _scale, _ship, PER_SHIP, SIDES } from './boost-streaks.constants';

export function boostTimerOf( entity: Entity ): number {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead ? 0 : sim.boostTimer;
    const buffer = entity.get( Interp )?.buffer;
    const last = buffer?.[ buffer.length - 1 ];
    return ! last || last.dead ? 0 : last.boost;
}

export function boostLevel( timer: number, easeS: number = DEFAULT_SIM_CONFIG.boostEaseS ): number {
    if ( timer <= 0 ) return 0;
    return easeS > 0 ? Math.min( 1, timer / easeS ) : 1;
}

export function writeShip( mesh: THREE.InstancedMesh, levels: Float32Array, at: number, entity: Entity ): number {
    const group = entity.get( Render );
    const net = entity.get( Net );
    if ( ! group || ! net || ! group.visible ) return 0;

    const level = boostLevel( boostTimerOf( entity ) );
    if ( level <= 0 ) return 0;

    const hull = tuningForShip( net.shipId );
    _ship.compose( group.position, group.quaternion, group.scale );
    _scale.set( BOOST_STREAK_WIDTH, 1, BOOST_STREAK_LENGTH * level );
    for ( let i = 0; i < PER_SHIP; i++ ) {
        _offset.set( SIDES[ i ] * BOOST_STREAK_SPREAD * hull.halfW, BOOST_STREAK_LIFT, -hull.halfL );
        _local.compose( _offset, _identity, _scale );
        _instance.multiplyMatrices( _ship, _local );
        mesh.setMatrixAt( at + i, _instance );
        levels[ at + i ] = level;
    }
    return PER_SHIP;
}
