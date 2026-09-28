import { MatchMakeError } from '@colyseus/sdk';
import { PUBLIC_ROOM_TAKEN_CODE, ROOM_NOT_FOUND_CODE, TOO_MANY_WRONG_CODES_CODE } from '@slur/shared';
import { NO_SERVER, QUICK_PLAY_FULL, RUN_FULL, TOO_MANY_WRONG_CODES } from './menu-form';

export type MenuIntent = 'quick' | 'create' | 'join';

export function menuIntent( raw: FormDataEntryValue | null ): MenuIntent {
    return raw === 'quick' || raw === 'join' ? raw : 'create';
}

export function menuErrorFor( intent: MenuIntent, code: string, error: unknown ): string {
    if ( ! ( error instanceof MatchMakeError ) ) return NO_SERVER;
    if ( error.code === TOO_MANY_WRONG_CODES_CODE ) return TOO_MANY_WRONG_CODES;
    if ( intent === 'join' && error.code === ROOM_NOT_FOUND_CODE ) {
        return error.message.includes( 'locked' ) ? RUN_FULL : `No run with code ${ code }.`;
    }
    if ( intent === 'quick' && error.code === PUBLIC_ROOM_TAKEN_CODE ) return QUICK_PLAY_FULL;
    return NO_SERVER;
}
