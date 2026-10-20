import { DEFAULT_SIM_CONFIG, RULE_SPECS, type SimConfig } from '@slur/shared';
import { num } from '../../dev/tuning';
import { isNumberPath } from '../../dev/tuning-schema';

export function tunedSimConfig(): SimConfig {
    const config = { ...DEFAULT_SIM_CONFIG };
    for ( const { id, key } of RULE_SPECS.values() ) {
        if ( ! isNumberPath( id ) ) throw new Error( `tuning: rule "${ id }" has no dial` );
        Object.defineProperty( config, key, { get: () => num( id ), enumerable: true, configurable: true } );
    }
    return config;
}
