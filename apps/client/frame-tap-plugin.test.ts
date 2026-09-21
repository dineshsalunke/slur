import { describe, expect, it } from 'vitest';
import { arbitrate, type TapUpload, validateTapName } from './frame-tap-plugin';

const upload = ( href: string, kind: TapUpload[ 'kind' ] = 'composed' ): TapUpload => ( {
    href,
    kind,
    firstDelta: 0.016,
    capturedDelta: 0.0002,
    pumped: 16,
    png: Buffer.from( 'png' ),
} );

describe( 'validateTapName', () => {
    it( 'defaults when no name is given', () => {
        expect( validateTapName( null ) ).toEqual( { ok: true, name: 'frame' } );
    } );

    it( 'accepts a plain slug', () => {
        expect( validateTapName( 'track-01' ) ).toEqual( { ok: true, name: 'track-01' } );
    } );

    it.each( [ '../../etc/passwd', 'a/b', 'a\\b', '.hidden', 'x.png', '', 'name with spaces', 'a'.repeat( 65 ) ] )(
        'rejects %j',
        ( bad ) => {
            expect( validateTapName( bad ).ok ).toBe( false );
        },
    );
} );

describe( 'arbitrate', () => {
    it( 'fails loudly when nobody answered', () => {
        const v = arbitrate( [] );
        expect( v.ok ).toBe( false );
        if ( ! v.ok ) {
            expect( v.status ).toBe( 504 );
            expect( v.error ).toMatch( /focused/ );
        }
    } );

    it( 'refuses to write when several tabs answered, and names them', () => {
        const v = arbitrate( [
            upload( 'http://localhost:5203/env-lab' ),
            upload( 'http://localhost:5203/game/demo' ),
        ] );
        expect( v.ok ).toBe( false );
        if ( ! v.ok ) {
            expect( v.status ).toBe( 409 );
            expect( v.responders ).toEqual( [ 'http://localhost:5203/env-lab', 'http://localhost:5203/game/demo' ] );
        }
    } );

    it( 'treats one responder sending both A/B images as a single responder', () => {
        const href = 'http://localhost:5203/env-lab';
        const v = arbitrate( [ upload( href, 'composed' ), upload( href, 'bloom-off' ) ] );
        expect( v.ok ).toBe( true );
        if ( v.ok ) expect( v.uploads ).toHaveLength( 2 );
    } );

    it( 'accepts a single responder', () => {
        expect( arbitrate( [ upload( 'http://localhost:5203/env-lab' ) ].slice() ).ok ).toBe( true );
    } );
} );
