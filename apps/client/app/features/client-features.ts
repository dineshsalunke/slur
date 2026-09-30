import type { ClientFeature } from '../engine/define-client-feature';
import { tugClient } from './tug/tug.client';

export const CLIENT_FEATURES: readonly ClientFeature[] = [ tugClient ];

export const DEV_FEATURES: readonly ClientFeature[] = [];
