import { useSyncExternalStore } from 'react';

const POLY_HAVEN_HDR = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr';
const RESOLUTION = '1k';

export const ENV_MODES = [ 'authored', 'hdri' ] as const;

export type EnvMode = ( typeof ENV_MODES )[ number ];

export const HDRI_SLUGS = [
    'blocky_photo_studio',
    'monochrome_studio_03',
    'studio_kontrast_02',
    'studio_kontrast_04',
    'white_studio_04',
] as const;

export const DEFAULT_HDRI_SLUG: string = HDRI_SLUGS[ 0 ];

export function hdriUrl( slug: string ): string {
    return `${ POLY_HAVEN_HDR }/${ RESOLUTION }/${ slug }_${ RESOLUTION }.hdr`;
}

const listeners = new Set< () => void >();

let mode: EnvMode = 'authored';
let slug = DEFAULT_HDRI_SLUG;

function notify(): void {
    for ( const listener of listeners ) listener();
}

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function envMode(): EnvMode {
    return mode;
}

export function setEnvMode( next: EnvMode ): void {
    if ( next === mode ) return;
    mode = next;
    notify();
}

export function hdriSlug(): string {
    return slug;
}

export function setHdriSlug( next: string ): void {
    const trimmed = next.trim();
    if ( trimmed === slug ) return;
    slug = trimmed;
    notify();
}

export function useEnvMode(): EnvMode {
    return useSyncExternalStore( subscribe, envMode, envMode );
}

export function useHdriSlug(): string {
    return useSyncExternalStore( subscribe, hdriSlug, hdriSlug );
}
