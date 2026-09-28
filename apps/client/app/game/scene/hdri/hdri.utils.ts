import type { HdriResolution } from '../../../quality/quality.constants';
import { HDRI_BARE_SLUG, HDRI_DIRECT_FILE, HDRI_SLUG } from './hdri.constants';

export type HdriLink =
    | { kind: 'default' }
    | { kind: 'file'; url: string }
    | { kind: 'slug'; slug: string }
    | { kind: 'invalid' };

export interface PolyHavenFiles {
    hdri?: Partial< Record< string, { hdr?: { url?: string } } > >;
}

export function parseHdriLink( link: string ): HdriLink {
    const text = link.trim();
    if ( text === '' ) return { kind: 'default' };
    if ( HDRI_DIRECT_FILE.test( text ) ) return { kind: 'file', url: text };
    const page = HDRI_SLUG.exec( text );
    if ( page ) return { kind: 'slug', slug: page[ 1 ].toLowerCase() };
    if ( HDRI_BARE_SLUG.test( text ) ) return { kind: 'slug', slug: text.toLowerCase() };
    return { kind: 'invalid' };
}

export function hdriFileUrl( files: PolyHavenFiles, resolution: HdriResolution ): string | null {
    return files.hdri?.[ resolution ]?.hdr?.url ?? null;
}

export function fileName( url: string ): string {
    return url.split( '/' ).pop()?.split( '?' )[ 0 ] ?? url;
}
