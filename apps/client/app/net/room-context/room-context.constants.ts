import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { createContext } from 'react';

export const RoomContext = createContext< Room< RunState > | null >( null );
