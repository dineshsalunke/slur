import { isSlot } from '../combat/combat-step.js';
import { type FireDir, fireDir } from '../combat/fire-dir.js';
import type { PlayerInput } from '../sim/input.js';
import { clamp } from '../sim/space.js';

export const MAX_QUEUED_INPUTS = 120;
export const TARGET_QUEUED_INPUTS = 3;
export const MAX_CATCHUP_INPUTS = 2;
export const MAX_QUEUED_FIRES = 4;

export interface FireIntent {
    slot: number;
    dir: FireDir;
    seq: number;
}

export interface PlayerQueue {
    inputs: PlayerInput[];
    fires: FireIntent[];
}

export function emptyQueue(): PlayerQueue {
    return { inputs: [], fires: [] };
}

export function clearQueue( q: PlayerQueue ): void {
    q.inputs.length = 0;
    q.fires.length = 0;
}

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

export function enqueueInputs( q: PlayerQueue, raw: unknown ): void {
    for ( const input of sanitizeInputs( raw ) ) q.inputs.push( input );
    if ( q.inputs.length > MAX_QUEUED_INPUTS ) q.inputs.splice( 0, q.inputs.length - MAX_QUEUED_INPUTS );
}

export function inputsThisTick( queued: number ): number {
    if ( queued <= 0 ) return 0;
    return 1 + Math.min( MAX_CATCHUP_INPUTS, Math.max( 0, queued - 1 - TARGET_QUEUED_INPUTS ) );
}

export function parseFire( raw: unknown ): FireIntent | null {
    if ( typeof raw !== 'object' || raw === null ) return null;
    const slot = 'slot' in raw ? raw.slot : undefined;
    if ( ! isSlot( slot ) ) return null;
    const dir = 'dir' in raw ? raw.dir : undefined;
    const seq = 'seq' in raw ? raw.seq : undefined;
    return { slot, dir: fireDir( dir ), seq: typeof seq === 'number' && Number.isSafeInteger( seq ) ? seq : 0 };
}

export function enqueueFire( q: PlayerQueue, raw: unknown ): void {
    const fire = parseFire( raw );
    if ( ! fire ) return;
    q.fires.push( fire );
    if ( q.fires.length > MAX_QUEUED_FIRES ) q.fires.shift();
}

export function takeFire( q: PlayerQueue, ack: number ): FireIntent | undefined {
    const next = q.fires[ 0 ];
    if ( ! next || next.seq > ack ) return undefined;
    return q.fires.shift();
}
