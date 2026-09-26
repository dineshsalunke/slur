import { PHASE } from '@slur/shared';

export const PHASE_VIEW: Record< number, { label: string; live: boolean; action: string } > = {
    [ PHASE.lobby ]: { label: 'Lobby', live: false, action: 'Join' },
    [ PHASE.countdown ]: { label: 'Starting', live: false, action: 'Join' },
    [ PHASE.racing ]: { label: 'Racing', live: true, action: 'Spectate' },
    [ PHASE.finished ]: { label: 'Results', live: true, action: 'Spectate' },
};
