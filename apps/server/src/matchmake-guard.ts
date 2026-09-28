import { type AuthContext, matchMaker } from '@colyseus/core';
import { clientIp } from './client-ip.js';

export interface MatchmakeCall {
    method: string;
    roomName: string;
    ip: string;
}

export interface MatchmakeGate {
    admit?( call: MatchmakeCall, nowMs: number ): void;
    failed?( call: MatchmakeCall, error: unknown, nowMs: number ): void;
}

export type InvokeMethod = (
    method: string,
    roomName: string,
    clientOptions?: unknown,
    authOptions?: AuthContext,
) => Promise< unknown >;

export function guardInvoke(
    invoke: InvokeMethod,
    gates: readonly MatchmakeGate[],
    now: () => number = Date.now,
): InvokeMethod {
    return async ( method, roomName, clientOptions, authOptions ) => {
        const call: MatchmakeCall = { method, roomName, ip: clientIp( authOptions ) };
        for ( const gate of gates ) gate.admit?.( call, now() );
        try {
            return await invoke( method, roomName, clientOptions, authOptions );
        } catch ( error ) {
            for ( const gate of gates ) gate.failed?.( call, error, now() );
            throw error;
        }
    };
}

export function installMatchmakeGuard( gates: readonly MatchmakeGate[] ): void {
    const { controller } = matchMaker;
    controller.invokeMethod = guardInvoke( controller.invokeMethod.bind( controller ), gates );
}
