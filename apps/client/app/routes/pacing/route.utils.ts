import { DEFAULT_SEED } from './route.constants';

export function parseSeed( raw: string | null ): number {
    if ( raw === null || raw.trim() === '' ) return DEFAULT_SEED;
    const n = Number( raw );
    return Number.isSafeInteger( n ) ? n : DEFAULT_SEED;
}
