import { ErrorCode, ServerError } from '@colyseus/core';
import { TOO_MANY_WRONG_CODES_CODE } from '@slur/shared';
import type { MatchmakeCall, MatchmakeGate } from './matchmake-guard.js';

export const FAILED_JOIN_LIMIT = 10;
export const FAILED_JOIN_WINDOW_MS = 60_000;
export const FAILED_JOIN_SWEEP_SIZE = 4096;

export class FailedJoinLimit implements MatchmakeGate {
    private readonly failures = new Map< string, number[] >();

    admit( call: MatchmakeCall, nowMs: number ): void {
        if ( call.method !== 'joinById' ) return;
        if ( this.recent( call.ip, nowMs ).length < FAILED_JOIN_LIMIT ) return;
        throw new ServerError( TOO_MANY_WRONG_CODES_CODE, 'Too many wrong room codes. Wait a minute.' );
    }

    failed( call: MatchmakeCall, error: unknown, nowMs: number ): void {
        if ( call.method !== 'joinById' ) return;
        if ( ! ( error instanceof ServerError ) || error.code !== ErrorCode.MATCHMAKE_INVALID_ROOM_ID ) return;
        if ( this.failures.size >= FAILED_JOIN_SWEEP_SIZE ) this.sweep( nowMs );
        this.failures.set( call.ip, [ ...this.recent( call.ip, nowMs ), nowMs ] );
    }

    tracked(): number {
        return this.failures.size;
    }

    private recent( ip: string, nowMs: number ): number[] {
        const list = ( this.failures.get( ip ) ?? [] ).filter( ( t ) => nowMs - t < FAILED_JOIN_WINDOW_MS );
        if ( list.length > 0 ) this.failures.set( ip, list );
        else this.failures.delete( ip );
        return list;
    }

    private sweep( nowMs: number ): void {
        for ( const ip of [ ...this.failures.keys() ] ) this.recent( ip, nowMs );
    }
}
