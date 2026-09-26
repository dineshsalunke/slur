import { createContext } from 'react';
import type { RunRoomLike } from '../run-room-like';

export const RoomContext = createContext< RunRoomLike | null >( null );
