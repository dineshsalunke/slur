import { clamp, type PlayerInput } from '@slur/shared';

export const MAX_QUEUED_INPUTS = 120;

function sanitizeInput( raw: unknown ): PlayerInput | null {
    if ( typeof raw !== 'object' || raw === null ) return null;
    const { seq, throttle, brake, strafe, jump } = raw as Record< string, unknown >;
    if ( ! Number.isSafeInteger( seq ) ) return null;
    if ( typeof throttle !== 'number' || ! Number.isFinite( throttle ) ) return null;
    if ( typeof brake !== 'number' || ! Number.isFinite( brake ) ) return null;
    if ( typeof strafe !== 'number' || ! Number.isFinite( strafe ) ) return null;
    return {
        seq: seq as number,
        throttle: clamp( throttle, 0, 1 ),
        brake: clamp( brake, 0, 1 ),
        strafe: clamp( strafe, -1, 1 ),
        jump: jump === true,
    };
}

export function sanitizeInputs( raw: unknown ): PlayerInput[] {
    if ( ! Array.isArray( raw ) ) return [];
    const out: PlayerInput[] = [];
    for ( const item of raw.slice( -MAX_QUEUED_INPUTS ) ) {
        const input = sanitizeInput( item );
        if ( input ) out.push( input );
    }
    return out;
}
