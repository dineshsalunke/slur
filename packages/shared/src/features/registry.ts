import { boltFeature } from './bolt/bolt.feature.js';
import type { SimFeature } from './define-sim-feature.js';
import { tugFeature } from './tug/tug.feature.js';

export const SIM_FEATURES = [ boltFeature, tugFeature ] as const satisfies readonly SimFeature[];
