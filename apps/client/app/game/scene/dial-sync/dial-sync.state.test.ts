import { describe, expect, it } from 'vitest';
import { num, setNum } from '../../../dev/tuning';
import { registerDialSync, syncDials } from './dial-sync.state';

const DIAL = 'Deck.seamEmissive';

function counter() {
    const hits = { n: 0 };
    return { hits, apply: () => void hits.n++ };
}

describe( 'dial sync', () => {
    it( 'applies once on register and not again while no dial moves', () => {
        const { hits, apply } = counter();
        const release = registerDialSync( apply );
        expect( hits.n ).toBe( 1 );
        for ( let frame = 0; frame < 5; frame++ ) syncDials();
        expect( hits.n ).toBe( 1 );
        release();
    } );

    it( 'applies each target once per dial change, and a second runner in the same frame applies nothing', () => {
        const a = counter();
        const b = counter();
        const releaseA = registerDialSync( a.apply );
        const releaseB = registerDialSync( b.apply );
        setNum( DIAL, num( DIAL ) + 1 );
        syncDials();
        syncDials();
        expect( [ a.hits.n, b.hits.n ] ).toEqual( [ 2, 2 ] );
        setNum( DIAL, num( DIAL ) - 1 );
        syncDials();
        expect( [ a.hits.n, b.hits.n ] ).toEqual( [ 3, 3 ] );
        releaseA();
        releaseB();
    } );

    it( 'stops applying a released target', () => {
        const { hits, apply } = counter();
        registerDialSync( apply )();
        setNum( DIAL, num( DIAL ) + 1 );
        syncDials();
        expect( hits.n ).toBe( 1 );
        setNum( DIAL, num( DIAL ) - 1 );
    } );
} );
