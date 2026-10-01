import { boltFeature } from './bolt/bolt.feature.js';
import type { SimFeature } from './define-sim-feature.js';
import { seekerFeature } from './seeker/seeker.feature.js';
import { tugFeature } from './tug/tug.feature.js';

export const SIM_FEATURES = [ boltFeature, seekerFeature, tugFeature ] as const satisfies readonly SimFeature[];
