import { createEventQueue } from '../event-queue';
import type { Mark } from './meteor-scorch';
import { QUEUE } from './meteor-scorch.constants';

export const pending = createEventQueue< Omit< Mark, 'born' | 'live' > >( QUEUE );
