import { PHASE } from '@slur/shared';
import { MUSIC } from './sfx-map';

export function musicForPhase( phase: number ): string {
    return phase === PHASE.racing ? MUSIC.run.name : MUSIC.lobby.name;
}
