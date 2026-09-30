import type { ClientFeature } from '../engine/define-client-feature';
import { boltClient } from './bolt/bolt.client';
import { tugClient } from './tug/tug.client';

export const CLIENT_FEATURES: readonly ClientFeature[] = [ boltClient, tugClient ];

export const DEV_FEATURES: readonly ClientFeature[] = [];
