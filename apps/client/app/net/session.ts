import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';

export const session: { room: Room< RunState > | null; lobby: Room | null } = { room: null, lobby: null };
