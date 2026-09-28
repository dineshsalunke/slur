import { PHASE } from './race/director.js';

export const KICK_MESSAGE = 'kick';
export const KICKED_MESSAGE = 'kicked';
export const KICKED_CODE = 403;
export const JOIN_TOKEN_MAX_CHARS = 64;
export const KICK_PHASES: readonly number[] = [ PHASE.lobby, PHASE.countdown, PHASE.finished ];

export function joinToken( options: unknown ): string | null {
    if ( typeof options !== 'object' || options === null ) return null;
    const token = ( options as { token?: unknown } ).token;
    if ( typeof token !== 'string' ) return null;
    const trimmed = token.trim();
    return trimmed && trimmed.length <= JOIN_TOKEN_MAX_CHARS ? trimmed : null;
}
