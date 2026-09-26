import { type AuthoredLevel, BLOCK_ID_STRIDE, HALF_WIDTH, SEG_LEN, START_SAFE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    applyTool,
    clampCamera,
    crowdedSegments,
    hash8,
    maxScrollX,
    screenX,
    screenY,
    slugOf,
    snapRect,
    viewOf,
    worldAt,
    zoomAround,
} from './track-editor.utils';

const LENGTH = 50 * SEG_LEN;
const SAFE = START_SAFE * SEG_LEN;

function level( over: Partial< AuthoredLevel > = {} ): AuthoredLevel {
    return {
        version: 1,
        id: 't',
        name: 't',
        length: 50,
        source: null,
        savedAt: '',
        blocks: [],
        gaps: [],
        ...over,
    };
}

describe( 'snapRect', () => {
    it( 'a click fills the one snap cell under the pointer', () => {
        const p = { x: 5.3, z: SAFE + 9.9 };
        expect( snapRect( p, p, 4, LENGTH ) ).toEqual( { x: 4, z: SAFE + 8, w: 4, l: 4 } );
    } );

    it( 'a drag covers every cell between its ends in any direction', () => {
        const a = { x: 9, z: SAFE + 30 };
        const b = { x: -3, z: SAFE + 1 };
        expect( snapRect( a, b, 2, LENGTH ) ).toEqual( { x: -4, z: SAFE, w: 14, l: 32 } );
    } );

    it( 'clamps to the deck edges and the finish', () => {
        const r = snapRect( { x: -HALF_WIDTH - 20, z: LENGTH - 1 }, { x: HALF_WIDTH + 20, z: LENGTH + 40 }, 8, LENGTH );
        expect( r ).toEqual( { x: -HALF_WIDTH, z: LENGTH - 8, w: 2 * HALF_WIDTH, l: 8 } );
    } );

    it( 'refuses the locked start band', () => {
        expect( snapRect( { x: 0, z: 10 }, { x: 4, z: SAFE - 5 }, 4, LENGTH ) ).toBeNull();
        expect( snapRect( { x: 0, z: 10 }, { x: 0, z: SAFE + 2 }, 4, LENGTH ) ).toEqual( {
            x: 0,
            z: SAFE,
            w: 4,
            l: 4,
        } );
    } );
} );

describe( 'applyTool', () => {
    const r = { x: 0, z: 200, w: 8, l: 4 };

    it( 'places destructible and solid blocks and gaps', () => {
        const a = applyTool( level(), 'destructible', r );
        const b = applyTool( a, 'solid', { ...r, z: 300 } );
        const c = applyTool( b, 'gap', { ...r, z: 400 } );
        expect( c.blocks ).toEqual( [
            { ...r, destructible: true },
            { ...r, z: 300, destructible: false },
        ] );
        expect( c.gaps ).toEqual( [ { ...r, z: 400 } ] );
    } );

    it( 'the eraser removes every rect it touches and keeps the rest', () => {
        const start = level( {
            blocks: [
                { x: -44.59, z: 200, w: 6.3, l: 20, destructible: false },
                { x: 10, z: 200, w: 4, l: 4, destructible: true },
            ],
            gaps: [
                { x: -48, z: 210, w: 96, l: 8 },
                { x: -48, z: 400, w: 96, l: 8 },
            ],
        } );
        const out = applyTool( start, 'eraser', { x: -40, z: 212, w: 1, l: 1 } );
        expect( out.blocks ).toEqual( [ start.blocks[ 1 ] ] );
        expect( out.gaps ).toEqual( [ start.gaps[ 1 ] ] );
    } );

    it( 'does not touch the input level', () => {
        const start = level();
        applyTool( start, 'gap', r );
        expect( start.gaps ).toEqual( [] );
    } );
} );

describe( 'crowdedSegments', () => {
    it( 'flags a segment over the block id stride, counting spanning blocks in each segment', () => {
        const blocks = Array.from( { length: BLOCK_ID_STRIDE }, ( _, k ) => ( {
            x: -48 + ( k % 24 ) * 4,
            z: 200 + Math.floor( k / 24 ) * 4,
            w: 1,
            l: 1,
            destructible: true,
        } ) );
        expect( crowdedSegments( blocks ) ).toEqual( [] );
        const spanning = { x: 0, z: 195, w: 1, l: 30, destructible: false };
        expect( crowdedSegments( [ ...blocks, spanning ] ) ).toEqual( [ 10 ] );
    } );
} );

describe( 'view mapping', () => {
    it( 'worldAt inverts screenX/screenY with z growing upward', () => {
        const v = viewOf( 1000, 700, { zoom: 1, scrollX: 0, scrollZ: 340 } );
        const p = worldAt( v, screenX( v, 12.5 ), screenY( v, 401 ) );
        expect( p.x ).toBeCloseTo( 12.5 );
        expect( p.z ).toBeCloseTo( 401 );
        expect( screenY( v, 400 ) ).toBeLessThan( screenY( v, 350 ) );
    } );

    it.each( [ 0.25, 1, 2.5, 8 ] )( 'worldAt inverts the view and snaps the same cell at zoom %f', ( zoom ) => {
        const v = viewOf( 1000, 700, { zoom, scrollX: 30, scrollZ: 340 } );
        const p = worldAt( v, screenX( v, 12.5 ), screenY( v, 401 ) );
        expect( p.x ).toBeCloseTo( 12.5 );
        expect( p.z ).toBeCloseTo( 401 );
        const q = worldAt( v, screenX( v, -3.2 ), screenY( v, 410.7 ) );
        expect( snapRect( p, q, 4, LENGTH ) ).toEqual( { x: -4, z: 400, w: 20, l: 12 } );
    } );

    it( 'zoomAround keeps the world point under the pointer', () => {
        const lvl = level();
        const from = clampCamera( 1000, 700, lvl, { zoom: 1, scrollX: 0, scrollZ: 300 } );
        const before = worldAt( viewOf( 1000, 700, from ), 700, 250 );
        for ( const zoom of [ 3, 8, 0.5 ] ) {
            const to = zoomAround( 1000, 700, lvl, from, 700, 250, zoom );
            const after = worldAt( viewOf( 1000, 700, to ), 700, 250 );
            expect( to.zoom ).toBe( zoom );
            if ( zoom > 1 ) expect( after.x ).toBeCloseTo( before.x );
            expect( after.z ).toBeCloseTo( before.z );
        }
    } );

    it( 'clamps zoom and keeps the deck inside the pan range', () => {
        const lvl = level();
        const c = clampCamera( 1000, 700, lvl, { zoom: 99, scrollX: 1e6, scrollZ: -5 } );
        expect( c.zoom ).toBe( 8 );
        expect( c.scrollX ).toBeCloseTo( maxScrollX( 1000, 8 ) );
        expect( c.scrollZ ).toBe( 0 );
        const v = viewOf( 1000, 700, c );
        expect( screenX( v, HALF_WIDTH ) ).toBeCloseTo( 1000 - 24 );
        expect( maxScrollX( 1000, 1 ) ).toBe( 0 );
    } );
} );

describe( 'slugOf and hash8', () => {
    it( 'slugs a free name', () => {
        expect( slugOf( '  My Gap Run #2! ' ) ).toBe( 'my-gap-run-2' );
        expect( slugOf( '!!!' ) ).toBe( '' );
    } );

    it( 'hashes to 8 hex digits and changes with the body', () => {
        expect( hash8( 'a' ) ).toMatch( /^[0-9a-f]{8}$/ );
        expect( hash8( 'a' ) ).not.toBe( hash8( 'b' ) );
    } );
} );
