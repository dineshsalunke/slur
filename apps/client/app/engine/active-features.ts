import { SIM_FEATURES, type SimFeature, sortFeatures } from '@slur/shared';
import { CLIENT_FEATURES, DEV_FEATURES } from '../features/client-features';
import type { ClientFeature } from './define-client-feature';

export function checkClientFeatures(
    features: readonly ClientFeature[],
    sim: readonly SimFeature[],
): readonly ClientFeature[] {
    const sorted = sortFeatures( features );
    for ( const f of sorted ) {
        if ( f.sim && ! sim.includes( f.sim ) ) {
            throw new Error( `client feature "${ f.id }": sim half "${ f.sim.id }" is not in SIM_FEATURES` );
        }
    }
    return sorted;
}

export const ACTIVE_FEATURES = checkClientFeatures(
    [ ...CLIENT_FEATURES, ...( import.meta.env.DEV ? DEV_FEATURES : [] ) ],
    SIM_FEATURES,
);

export const FEATURE_SYSTEMS = ACTIVE_FEATURES.flatMap( ( f ) => f.systems ?? [] );
