import { createEventQueue } from '../event-queue';
import type { ChunkBurst } from './meteor-chunks';
import { QUEUE } from './meteor-chunks.constants';

export const pending = createEventQueue< ChunkBurst >( QUEUE );
