import type { RunRoomLike } from '../../net/run-room-like';
import { useSelfSpectating } from '../net/standings-store';
import { SpectatorBar } from './spectator-bar';

export function SpectatorGate( { room }: { room: RunRoomLike } ) {
    return useSelfSpectating( room ) ? <SpectatorBar room={ room } /> : null;
}
