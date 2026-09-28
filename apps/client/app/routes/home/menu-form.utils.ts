import { MatchMakeError } from '@colyseus/sdk';
import {
    CREATE_LIMIT_CODE,
    KICKED_CODE,
    PUBLIC_ROOM_TAKEN_CODE,
    ROOM_NOT_FOUND_CODE,
    SERVER_FULL_CODE,
    TOO_MANY_WRONG_CODES_CODE,
} from '@slur/shared';
import {
    CREATE_LIMIT,
    NO_SERVER,
    QUICK_PLAY_FULL,
    REMOVED,
    RUN_FULL,
    SERVER_FULL,
    TOO_MANY_WRONG_CODES,
} from './menu-form';

export type MenuIntent = 'quick' | 'create' | 'join';

export function menuIntent( raw: FormDataEntryValue | null ): MenuIntent {
    return raw === 'quick' || raw === 'join' ? raw : 'create';
}

export function menuErrorFor( intent: MenuIntent, code: string, error: unknown ): string {
    if ( ! ( error instanceof MatchMakeError ) ) return NO_SERVER;
    if ( error.code === TOO_MANY_WRONG_CODES_CODE ) return TOO_MANY_WRONG_CODES;
    if ( error.code === SERVER_FULL_CODE ) return SERVER_FULL;
    if ( error.code === CREATE_LIMIT_CODE ) return CREATE_LIMIT;
    if ( error.code === KICKED_CODE ) return REMOVED;
    if ( intent === 'join' && error.code === ROOM_NOT_FOUND_CODE ) {
        return error.message.includes( 'locked' ) ? RUN_FULL : `No run with code ${ code }.`;
    }
    if ( intent === 'quick' && error.code === PUBLIC_ROOM_TAKEN_CODE ) return QUICK_PLAY_FULL;
    return NO_SERVER;
}
