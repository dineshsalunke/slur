import type { RosterEntry } from '../../game/hud/roster-panel';

export const FIXTURE_FIELD = 8;
export const FIXTURE_RANK = 4;

export const FIXTURE_ROSTER: readonly RosterEntry[] = [
    { id: 'nova', rank: 2, name: 'Nova' },
    { id: 'echo', rank: 3, name: 'Echo' },
    { id: 'you', rank: FIXTURE_RANK, name: 'You', self: true },
    { id: 'vex', rank: 5, name: 'Vex' },
    { id: 'orbit', rank: 6, name: 'Orbit' },
];
