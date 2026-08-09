import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';

// Module session holder — the joined rooms stashed OUTSIDE React's render cycle so they survive navigation
// (landing → game → results). `room` is the run the player is in; `lobby` is the long-lived LobbyRoom
// connection powering the live room list (kept joined for the app's lifetime — no per-view teardown). This
// module-singleton ownership (never a component effect) is the S2 lesson made structural.
export const session: { room: Room< RunState > | null; lobby: Room | null } = { room: null, lobby: null };
