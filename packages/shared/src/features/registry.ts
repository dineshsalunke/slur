import { boltFeature } from './bolt/bolt.feature.js';
import { boostFeature } from './boost/boost.feature.js';
import type { SimFeature } from './define-sim-feature.js';
import { mineFeature } from './mine/mine.feature.js';
import { seekerFeature } from './seeker/seeker.feature.js';
import { shieldFeature } from './shield/shield.feature.js';
import { tugFeature } from './tug/tug.feature.js';

export const SIM_FEATURES = [
    boltFeature,
    mineFeature,
    seekerFeature,
    tugFeature,
    boostFeature,
    shieldFeature,
] as const satisfies readonly SimFeature[];
