import type { RespawnPoint } from '@slur/shared';
import { START_PARAM } from './start-point.constants';

function round2( v: number ): number {
    return Math.round( v * 100 ) / 100;
}

export function parseStart( value: string | null ): RespawnPoint | null {
    const parts = value?.split( ',' ) ?? [];
    if ( parts.length !== 2 || parts.some( ( p ) => p.trim() === '' ) ) return null;
    const x = Number( parts[ 0 ] );
    const z = Number( parts[ 1 ] );
    return Number.isFinite( x ) && Number.isFinite( z ) ? { x, z } : null;
}

export function formatStart( p: RespawnPoint ): string {
    return `${ round2( p.x ) },${ round2( p.z ) }`;
}

export function startOf( search: string ): RespawnPoint | null {
    return parseStart( new URLSearchParams( search ).get( START_PARAM ) );
}

export function withStart( search: string, p: RespawnPoint | null ): string {
    const params = new URLSearchParams( search );
    if ( p === null ) params.delete( START_PARAM );
    else params.set( START_PARAM, formatStart( p ) );
    const text = params.toString().replaceAll( '%2C', ',' );
    return text === '' ? '' : `?${ text }`;
}
