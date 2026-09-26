import { DEFAULT_SIM_CONFIG, DEFAULT_TUNING, tuningForShip } from '@slur/shared';
import type { Entity, World } from 'koota';
import { LocalPlayer, Net, Sim } from '../ecs/traits';

export function boostSurplus( vz: number, maxCruise: number, gain = DEFAULT_SIM_CONFIG.boostGain ): number {
    if ( maxCruise <= 0 || gain <= 0 ) return 0;
    const t = ( vz - maxCruise ) / ( gain * maxCruise );
    return Math.min( 1, Math.max( 0, t ) );
}

export function maxCruiseOf( e: Entity ): number {
    const net = e.get( Net );
    return net ? tuningForShip( net.shipId ).maxCruise : DEFAULT_TUNING.maxCruise;
}

export function localBoostSurplus( world: World ): number {
    const e = world.queryFirst( LocalPlayer, Sim );
    const sim = e?.get( Sim );
    if ( ! e || ! sim || sim.dead ) return 0;
    return boostSurplus( sim.vz, maxCruiseOf( e ) );
}
