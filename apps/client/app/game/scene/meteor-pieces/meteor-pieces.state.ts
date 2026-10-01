import { createEventQueue } from '../event-queue';
import type { PieceBurst } from './meteor-pieces';
import { QUEUE } from './meteor-pieces.constants';

export const pending = createEventQueue< PieceBurst >( QUEUE );
