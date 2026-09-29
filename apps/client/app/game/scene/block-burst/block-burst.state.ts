import { createEventQueue } from '../event-queue';
import type { Burst } from './block-burst';
import { SLOTS } from './block-burst.constants';

export const pending = createEventQueue< Burst >( SLOTS );
