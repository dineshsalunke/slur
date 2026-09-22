export function speedText( vz: number ): string {
    if ( ! Number.isFinite( vz ) ) return '0';
    return String( Math.max( 0, Math.round( vz ) ) );
}

export function progressText( z: number, finishZ: number ): string {
    if ( ! Number.isFinite( z ) || ! Number.isFinite( finishZ ) || finishZ <= 0 ) return '0%';
    const clamped = Math.min( Math.max( z, 0 ), finishZ );
    return `${ Math.round( ( clamped / finishZ ) * 100 ) }%`;
}

export function clockText( seconds: number ): string {
    if ( ! Number.isFinite( seconds ) ) return '00:00';
    const total = Math.max( 0, Math.floor( seconds ) );
    const minutes = Math.floor( total / 60 );
    return `${ String( minutes ).padStart( 2, '0' ) }:${ String( total % 60 ).padStart( 2, '0' ) }`;
}

export function rankText( rank: number, field: number ): string {
    return `${ rank } / ${ field }`;
}
