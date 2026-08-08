import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';

// Module session holder — the joined room stashed by the clientLoader so it survives outside React's
// render cycle. In S4 (lobby route → gameplay route) this is what lets the room outlive a navigation;
// for S2 it's the loader→component handoff plus a stable place for teardown to find the room.
export const session: { room: Room<RunState> | null } = { room: null };
