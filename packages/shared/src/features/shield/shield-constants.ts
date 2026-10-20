import type { HitMessage } from '../../combat/constants.js';
import { runEvent } from '../../run/run-event.js';

export const SHIELD_POP_MESSAGE = runEvent< HitMessage >( 'shieldPop' );

export const SHIELD_RATIO = 0.15;
export const SHIELD_S = 5;
