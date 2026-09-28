import type { AuthContext } from '@colyseus/core';

export const UNKNOWN_IP = 'unknown';

export function clientIp( context?: Pick< AuthContext, 'ip' > ): string {
    const raw = context?.ip;
    const header = Array.isArray( raw ) ? raw.at( -1 ) : raw;
    const hops = ( header ?? '' )
        .split( ',' )
        .map( ( hop ) => hop.trim() )
        .filter( Boolean );
    return hops.at( -1 ) ?? UNKNOWN_IP;
}
