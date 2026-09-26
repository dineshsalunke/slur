import { noteVoice, type ScoreNote } from '@slur/shared';
import { VOICE_CLASS } from './note-row.constants';

export function noteClass( n: ScoreNote ): string {
    return VOICE_CLASS[ noteVoice( n ) ];
}
