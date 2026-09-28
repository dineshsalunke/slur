export const ROOM_CODE_ALPHABET = '23456789BCDFGHJKMNPQRSTVWXYZ';
export const ROOM_CODE_LENGTH = 5;

export const ROOM_NOT_FOUND_CODE = 522;
export const PUBLIC_ROOM_TAKEN_CODE = 409;
export const TOO_MANY_WRONG_CODES_CODE = 429;
export const CREATE_LIMIT_CODE = 430;
export const SERVER_FULL_CODE = 503;

export interface RunCreateOptions {
    name?: string;
    public?: boolean;
}

const ROOM_CODE_SHAPE = new RegExp( `^[${ ROOM_CODE_ALPHABET }]{${ ROOM_CODE_LENGTH }}$` );

export function normalizeRoomCode( raw: unknown ): string | null {
    if ( typeof raw !== 'string' ) return null;
    const code = raw.trim().toUpperCase();
    return ROOM_CODE_SHAPE.test( code ) ? code : null;
}

export function makeRoomCode( randomIndex: ( size: number ) => number ): string {
    let code = '';
    for ( let i = 0; i < ROOM_CODE_LENGTH; i++ ) code += ROOM_CODE_ALPHABET[ randomIndex( ROOM_CODE_ALPHABET.length ) ];
    return code;
}

export function isPublicCreate( options: unknown ): boolean {
    return typeof options === 'object' && options !== null && ( options as RunCreateOptions ).public === true;
}
