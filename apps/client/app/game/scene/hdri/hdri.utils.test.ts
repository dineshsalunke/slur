import { describe, expect, it } from 'vitest';
import { fileName, hdriFileUrl, parseHdriLink } from './hdri.utils';

describe( 'parseHdriLink', () => {
    it( 'reads the slug from a Poly Haven asset page', () => {
        expect( parseHdriLink( 'https://polyhaven.com/a/kloppenheim_06' ) ).toEqual( {
            kind: 'slug',
            slug: 'kloppenheim_06',
        } );
        expect( parseHdriLink( '  polyhaven.com/a/Moonless_Golf?c=night ' ) ).toEqual( {
            kind: 'slug',
            slug: 'moonless_golf',
        } );
    } );

    it( 'accepts a bare slug', () => {
        expect( parseHdriLink( 'satara_night' ) ).toEqual( { kind: 'slug', slug: 'satara_night' } );
    } );

    it( 'passes a direct .hdr file through', () => {
        const url = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_06_1k.hdr';
        expect( parseHdriLink( url ) ).toEqual( { kind: 'file', url } );
    } );

    it( 'treats an empty field as the default and rejects other text', () => {
        expect( parseHdriLink( '   ' ) ).toEqual( { kind: 'default' } );
        expect( parseHdriLink( 'https://example.com/sky.png' ) ).toEqual( { kind: 'invalid' } );
    } );
} );

describe( 'hdriFileUrl', () => {
    const files = { hdri: { '1k': { hdr: { url: 'https://dl.polyhaven.org/a_1k.hdr' } } } };

    it( 'picks the .hdr at the requested resolution', () => {
        expect( hdriFileUrl( files, '1k' ) ).toBe( 'https://dl.polyhaven.org/a_1k.hdr' );
    } );

    it( 'returns null for a missing resolution or a non-HDRI asset', () => {
        expect( hdriFileUrl( files, '2k' ) ).toBeNull();
        expect( hdriFileUrl( {}, '1k' ) ).toBeNull();
    } );
} );

describe( 'fileName', () => {
    it( 'keeps the last path segment without the query', () => {
        expect( fileName( 'https://x.org/hdr/1k/sky_1k.hdr?v=2' ) ).toBe( 'sky_1k.hdr' );
    } );
} );
