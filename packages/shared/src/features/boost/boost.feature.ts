import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type SimFeature } from '../define-sim-feature.js';
import { fireBoost } from './boost-run.js';
import { boostCap, boostThrust, clearBoostStatus, tickBoostStatus } from './boost-status.js';

export * from './boost-constants.js';
export { boostCap, boostThrust, startBoost } from './boost-status.js';

const BOOST_FIELDS = { boostTimer: { type: 'float32', default: 0, sim: true } } as const;

export const boostFeature: SimFeature< typeof BOOST_FIELDS > = defineSimFeature( {
    id: 'boost',
    power: { kind: HeldPower.boost, bagWeight: ( cfg ) => cfg.boostRatio },
    fields: { player: BOOST_FIELDS },
    ship: { thrust: boostThrust, cap: boostCap, tick: tickBoostStatus, clear: clearBoostStatus },
    run: {
        open: () => undefined,
        use: fireBoost,
    },
} );
