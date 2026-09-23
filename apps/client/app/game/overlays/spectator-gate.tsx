import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useSelfSpectating } from '../net/standings-store';
import { SpectatorBar } from './spectator-bar';

export function SpectatorGate( { room }: { room: Room< RunState > } ) {
    return useSelfSpectating( room ) ? <SpectatorBar room={ room } /> : null;
}
