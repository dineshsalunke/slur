import { EventEmitter } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { arbitrate, frameTapPlugin, type TapUpload, validateTapName } from './frame-tap-plugin';

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

type Handler = ( req: unknown, res: unknown, next: () => void ) => void;

class FakeRes {
    statusCode = 0;
    headersSent = false;
    writableEnded = false;
    bodies: string[] = [];
    setHeader(): void {
        if ( this.headersSent ) throw new Error( 'ERR_HTTP_HEADERS_SENT' );
    }
    end( body: string ): void {
        if ( this.writableEnded ) throw new Error( 'write after end' );
        this.headersSent = true;
        this.writableEnded = true;
        this.bodies.push( body );
    }
}

const mountTap = () => {
    let middleware: Handler = () => {};
    const hotHandlers = new Map< string, ( data: unknown ) => void >();
    const sent: { id: string }[] = [];
    const server = {
        hot: {
            on: ( event: string, fn: ( data: unknown ) => void ) => hotHandlers.set( event, fn ),
            send: ( _event: string, data: { id: string } ) => sent.push( data ),
        },
        middlewares: { use: ( _route: string, fn: Handler ) => ( middleware = fn ) },
    };
    const plugin = frameTapPlugin( { dir: mkdtempSync( join( tmpdir(), 'frame-tap-' ) ) } );
    ( plugin.configureServer as ( s: unknown ) => void )( server );

    const tap = ( query: string ): FakeRes => {
        const res = new FakeRes();
        middleware( { url: `/?${ query }` }, res, () => {} );
        return res;
    };
    const upload = ( id: string ): { req: EventEmitter; res: FakeRes } => {
        const req = Object.assign( new EventEmitter(), {
            url: `/upload?id=${ id }`,
            headers: { 'x-frame-tap-href': 'http://localhost:5173/test-level' },
            destroy: () => {},
        } );
        const res = new FakeRes();
        middleware( req, res, () => {} );
        return { req, res };
    };
    const hot = ( event: string, data: unknown ) => hotHandlers.get( event )?.( data );
    return { tap, upload, hot, lastId: () => sent[ sent.length - 1 ].id };
};

describe( 'frameTapPlugin settles each tap once', () => {
    beforeEach( () => {
        vi.useFakeTimers();
    } );
    afterEach( () => {
        vi.useRealTimers();
    } );

    it( 'answers once when the deadline passes while an upload is still streaming', () => {
        const t = mountTap();
        const res = t.tap( 'name=race&timeout=250' );
        const up = t.upload( t.lastId() );
        vi.advanceTimersByTime( 250 );
        up.req.emit( 'data', Buffer.from( 'png' ) );
        up.req.emit( 'end' );
        expect( () => vi.advanceTimersByTime( 1000 ) ).not.toThrow();
        expect( res.bodies ).toHaveLength( 1 );
        expect( res.statusCode ).toBe( 504 );
        expect( up.res.statusCode ).toBe( 410 );
    } );

    it( 'answers once when the page reports an error after the deadline', () => {
        const t = mountTap();
        const res = t.tap( 'name=race&timeout=250' );
        const id = t.lastId();
        vi.advanceTimersByTime( 250 );
        expect( () => t.hot( 'slur:frame-tap:error', { id, message: 'late' } ) ).not.toThrow();
        expect( res.bodies ).toHaveLength( 1 );
    } );

    it( 'answers once when the page reports an error during the settle window', () => {
        const t = mountTap();
        const res = t.tap( 'name=race&timeout=250' );
        const id = t.lastId();
        const up = t.upload( id );
        up.req.emit( 'data', Buffer.from( 'png' ) );
        up.req.emit( 'end' );
        t.hot( 'slur:frame-tap:error', { id, message: 'mid-settle' } );
        expect( () => vi.advanceTimersByTime( 1000 ) ).not.toThrow();
        expect( res.bodies ).toHaveLength( 1 );
        expect( res.statusCode ).toBe( 502 );
    } );

    it( 'still writes the frame for a single clean upload', () => {
        const t = mountTap();
        const res = t.tap( 'name=clean&timeout=250' );
        const up = t.upload( t.lastId() );
        up.req.emit( 'data', Buffer.from( 'png' ) );
        up.req.emit( 'end' );
        vi.advanceTimersByTime( 1000 );
        expect( res.bodies ).toHaveLength( 1 );
        expect( res.statusCode ).toBe( 200 );
        expect( JSON.parse( res.bodies[ 0 ] ).files.composed ).toMatch( /clean\.png$/ );
    } );
} );
