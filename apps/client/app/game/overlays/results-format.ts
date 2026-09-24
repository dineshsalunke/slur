import { isShipId, SHIPS } from '@slur/shared';

function centis( s: number ): number {
    return Math.round( s * 100 );
}

export function raceTime( s: number ): string {
    const cs = centis( s );
    const m = Math.floor( cs / 6000 );
    const sec = Math.floor( ( cs % 6000 ) / 100 );
    const c = cs % 100;
    return `${ m }:${ String( sec ).padStart( 2, '0' ) }.${ String( c ).padStart( 2, '0' ) }`;
}

export function gapTo( leader: number, s: number ): string {
    return `+${ ( ( centis( s ) - centis( leader ) ) / 100 ).toFixed( 2 ) }`;
}

export function ordinal( n: number ): string {
    const teen = n % 100 >= 11 && n % 100 <= 13;
    const suffix = teen ? 'th' : ( [ 'th', 'st', 'nd', 'rd' ][ n % 10 ] ?? 'th' );
    return `${ n }${ suffix }`;
}

export function shipName( id: string ): string {
    return isShipId( id ) ? SHIPS[ id ].name : id;
}
