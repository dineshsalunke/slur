import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { remember, restore } from '../../../dev/tuning-persist';
import { qualityProfile } from '../../../quality/quality.state';
import { HDRI_DEFAULT_URL, HDRI_FILES_API, HDRI_LINK_PATH } from './hdri.constants';
import { fileName, hdriFileUrl, type PolyHavenFiles, parseHdriLink } from './hdri.utils';

const loader = new HDRLoader();

const hdri = {
    texture: null as THREE.Texture | null,
    link: null as string | null,
    status: '',
    failed: false,
    token: 0,
};

async function resolveUrl( link: string ): Promise< string > {
    const parsed = parseHdriLink( link );
    if ( parsed.kind === 'default' ) return HDRI_DEFAULT_URL;
    if ( parsed.kind === 'file' ) return parsed.url;
    if ( parsed.kind === 'invalid' ) throw new Error( 'not a Poly Haven link' );

    const response = await fetch( `${ HDRI_FILES_API }${ parsed.slug }` );
    if ( ! response.ok ) throw new Error( `no Poly Haven asset "${ parsed.slug }"` );
    const url = hdriFileUrl( ( await response.json() ) as PolyHavenFiles, qualityProfile().hdriRes );
    if ( ! url ) throw new Error( `"${ parsed.slug }" has no ${ qualityProfile().hdriRes } HDRI` );
    return url;
}

export function hdriLink(): string {
    return restore( HDRI_LINK_PATH, '' );
}

export async function showHdri( link: string ): Promise< string > {
    if ( link === hdri.link && ! hdri.failed ) return hdri.status;
    hdri.failed = false;
    hdri.link = link;
    remember( HDRI_LINK_PATH, link, '' );
    const token = ++hdri.token;
    hdri.status = 'loading…';

    try {
        const url = await resolveUrl( link );
        const texture = await loader.loadAsync( url );
        if ( token !== hdri.token ) {
            texture.dispose();
            return hdri.status;
        }
        texture.mapping = THREE.EquirectangularReflectionMapping;
        hdri.texture?.dispose();
        hdri.texture = texture;
        hdri.status = fileName( url );
    } catch ( error ) {
        if ( token === hdri.token ) {
            hdri.failed = true;
            hdri.status = `error: ${ error instanceof Error ? error.message : 'load failed' }`;
        }
    }
    return hdri.status;
}

export function environmentMap(): THREE.Texture | null {
    if ( hdri.link === null ) void showHdri( hdriLink() );
    return hdri.texture;
}
