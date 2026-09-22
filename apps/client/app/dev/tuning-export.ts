import { col, num } from './tuning';
import { COLOR_TUNABLES, type ColorPath, NUMBER_TUNABLES, type NumberPath } from './tuning-schema';

export function changedDefaults(): string {
    const lines: string[] = [];

    for ( const path of Object.keys( NUMBER_TUNABLES ) as NumberPath[] ) {
        const value = num( path );
        if ( value !== NUMBER_TUNABLES[ path ].value ) lines.push( `    '${ path }': ${ value },` );
    }

    for ( const path of Object.keys( COLOR_TUNABLES ) as ColorPath[] ) {
        const value = col( path );
        const base = COLOR_TUNABLES[ path ].value;
        if ( value.toLowerCase() !== base.toLowerCase() ) lines.push( `    '${ path }': '${ value }',` );
    }

    return lines.join( '\n' );
}

export function copyDefaults(): void {
    const text = changedDefaults();
    console.log( text || 'tuning: every value matches tuning-schema.ts' );
    if ( text ) void navigator.clipboard?.writeText( text );
}
