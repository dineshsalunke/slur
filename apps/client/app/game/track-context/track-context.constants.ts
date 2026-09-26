import type { Track } from '@slur/shared';
import { createContext } from 'react';

export const TrackContext = createContext< Track | null >( null );
