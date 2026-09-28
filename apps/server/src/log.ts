export type LogFields = Record< string, string | number >;

export function formatEvent( event: string, fields: LogFields = {} ): string {
    const pairs = Object.entries( fields ).map( ( [ key, value ] ) => `${ key }=${ value }` );
    return [ 'slur', `event=${ event }`, ...pairs ].join( ' ' );
}

export function logEvent( event: string, fields: LogFields = {} ): void {
    console.log( formatEvent( event, fields ) );
}

export function phaseLogger( room: string ): ( phase: number ) => void {
    let last = -1;
    return ( phase ) => {
        if ( phase === last ) return;
        last = phase;
        logEvent( 'room.phase', { room, phase } );
    };
}
