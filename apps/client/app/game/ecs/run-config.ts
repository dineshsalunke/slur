import { DEFAULT_SIM_CONFIG, type SimConfig } from '@slur/shared';
import { trait, type World } from 'koota';

export const RunConfig = trait( (): SimConfig => DEFAULT_SIM_CONFIG );

export function runConfig( world: World ): SimConfig {
    return world.get( RunConfig ) ?? DEFAULT_SIM_CONFIG;
}

export function holdRunConfig( world: World, config: SimConfig ): () => void {
    if ( world.has( RunConfig ) ) world.set( RunConfig, config );
    else world.add( RunConfig( config ) );
    return () => {
        if ( world.get( RunConfig ) === config ) world.remove( RunConfig );
    };
}
