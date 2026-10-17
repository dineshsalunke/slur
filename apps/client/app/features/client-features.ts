import type { ClientFeature } from '../engine/define-client-feature';
import { boltClient } from './bolt/bolt.client';
import { boostClient } from './boost/boost.client';
import { mineClient } from './mine/mine.client';
import { portalClient } from './portal/portal.client';
import { seekerClient } from './seeker/seeker.client';
import { shieldClient } from './shield/shield.client';
import { tugClient } from './tug/tug.client';

export const CLIENT_FEATURES: readonly ClientFeature[] = [
    boltClient,
    boostClient,
    mineClient,
    portalClient,
    seekerClient,
    shieldClient,
    tugClient,
];

export const DEV_FEATURES: readonly ClientFeature[] = [];
