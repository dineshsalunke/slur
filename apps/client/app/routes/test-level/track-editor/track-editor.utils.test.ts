import { type AuthoredLevel, type AuthoredRect, BLOCK_ID_STRIDE, HALF_WIDTH, SEG_LEN, START_SAFE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { EditorPoint } from './track-editor.state';
import {
    applyTool,
    clampCamera,
    crowdedSegments,
    hash8,
    maxScrollX,
    normalizeLevel,
    outlineSegments,
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

    function area( rects: readonly AuthoredRect[] ): number {
        return rects.reduce( ( s, q ) => s + q.w * q.l, 0 );
    }

    function covers( rects: readonly AuthoredRect[], x: number, z: number ): boolean {
        return rects.some( ( q ) => x > q.x && x < q.x + q.w && z > q.z && z < q.z + q.l );
    }

    describe.each( [ 1, 4 ] )( 'the eraser subtracts at snap %i', ( snap ) => {
        const gap = { x: -8 * snap, z: 200, w: 16 * snap, l: 8 * snap };
        const erase = ( lvl: AuthoredLevel, a: EditorPoint, b: EditorPoint ): AuthoredLevel => {
            const cell = snapRect( a, b, snap, LENGTH );
            if ( ! cell ) throw new Error( 'no cell' );
            return applyTool( lvl, 'eraser', cell );
        };

        it( 'a click in the middle leaves four pieces around one cell', () => {
            const out = erase(
                level( { gaps: [ gap ] } ),
                { x: 0.5, z: 200 + 3.5 * snap },
                { x: 0.5, z: 200 + 3.5 * snap },
            );
            expect( out.gaps ).toHaveLength( 4 );
            expect( area( out.gaps ) ).toBe( area( [ gap ] ) - snap * snap );
            expect( covers( out.gaps, snap / 2, 200 + 3.5 * snap ) ).toBe( false );
            expect( covers( out.gaps, -snap / 2, 200 + 3.5 * snap ) ).toBe( true );
            expect( covers( out.gaps, snap / 2, 200 + 2.5 * snap ) ).toBe( true );
        } );

        it( 'a cell on an edge leaves three pieces', () => {
            const out = erase( level( { gaps: [ gap ] } ), { x: 0.5, z: 200.5 }, { x: 0.5, z: 200.5 } );
            expect( out.gaps ).toHaveLength( 3 );
            expect( area( out.gaps ) ).toBe( area( [ gap ] ) - snap * snap );
        } );

        it( 'a corner cell leaves two pieces and keeps the destructible flag', () => {
            const block = { ...gap, destructible: true };
            const out = erase(
                level( { blocks: [ block ] } ),
                { x: gap.x + 0.5, z: 200.5 },
                { x: gap.x + 0.5, z: 200.5 },
            );
            expect( out.blocks ).toHaveLength( 2 );
            expect( area( out.blocks ) ).toBe( area( [ block ] ) - snap * snap );
            expect( out.blocks.every( ( b ) => b.destructible ) ).toBe( true );
            expect( covers( out.blocks, gap.x + snap / 2, 200 + snap / 2 ) ).toBe( false );
        } );

        it( 'a drag that covers the rect removes it', () => {
            const out = erase(
                level( { gaps: [ gap ] } ),
                { x: gap.x - snap, z: 199 },
                { x: gap.x + gap.w + 0.5, z: 200 + gap.l + 0.5 },
            );
            expect( out.gaps ).toEqual( [] );
        } );

        it( 'a drag across several rects cuts each and leaves the untouched one whole', () => {
            const solid = { x: -8 * snap, z: 200 + 10 * snap, w: 4 * snap, l: 4 * snap, destructible: false };
            const far = { x: 0, z: 200 + 40 * snap, w: snap, l: snap };
            const start = level( { blocks: [ solid ], gaps: [ gap, far ] } );
            const out = erase(
                start,
                { x: -6 * snap + 0.5, z: 200 + 4.5 * snap },
                { x: -5 * snap + 0.5, z: 200 + 11.5 * snap },
            );
            const cut = 2 * snap * ( 4 * snap ) + 2 * snap * ( 2 * snap );
            expect( area( [ ...out.blocks, ...out.gaps ] ) ).toBe( area( [ solid, gap, far ] ) - cut );
            expect( out.blocks.every( ( b ) => ! b.destructible ) ).toBe( true );
            expect( out.gaps ).toContainEqual( far );
            expect( covers( out.gaps, -5.5 * snap, 200 + 5 * snap ) ).toBe( false );
            expect( covers( out.blocks, -5.5 * snap, 200 + 11 * snap ) ).toBe( false );
            expect( covers( out.blocks, -7.5 * snap, 200 + 11 * snap ) ).toBe( true );
        } );
    } );

    it( 'does not touch the input level', () => {
        const start = level();
        applyTool( start, 'gap', r );
        expect( start.gaps ).toEqual( [] );
    } );
} );

describe( 'shapes of one kind combine', () => {
    function cellsOf( rects: readonly AuthoredRect[] ): Set< string > {
        const cells = new Set< string >();
        for ( const r of rects ) {
            for ( let x = r.x; x < r.x + r.w; x++ )
                for ( let z = r.z; z < r.z + r.l; z++ ) cells.add( `${ x },${ z }` );
        }
        return cells;
    }

    function cellCount( rects: readonly AuthoredRect[] ): number {
        return rects.reduce( ( s, q ) => s + q.w * q.l, 0 );
    }

    it( 'two touching rects with a rectangular union become one', () => {
        const block = applyTool( level(), 'solid', { x: 0, z: 200, w: 8, l: 8 } );
        const bar = applyTool( block, 'solid', { x: 0, z: 208, w: 8, l: 2 } );
        expect( bar.blocks ).toEqual( [ { x: 0, z: 200, w: 8, l: 10, destructible: false } ] );
        const side = applyTool( level(), 'gap', { x: 0, z: 200, w: 4, l: 6 } );
        expect( applyTool( side, 'gap', { x: 4, z: 200, w: 6, l: 6 } ).gaps ).toEqual( [
            { x: 0, z: 200, w: 10, l: 6 },
        ] );
    } );

    it( 'an overlapping draw adds no area twice', () => {
        const a = applyTool( level(), 'destructible', { x: 0, z: 200, w: 8, l: 8 } );
        const b = applyTool( a, 'destructible', { x: 4, z: 204, w: 8, l: 8 } );
        expect( cellCount( b.blocks ) ).toBe( 64 + 64 - 16 );
        expect( cellsOf( b.blocks ).size ).toBe( cellCount( b.blocks ) );
    } );

    it( 'an L stays two rects', () => {
        const a = applyTool( level(), 'solid', { x: 0, z: 200, w: 12, l: 4 } );
        const b = applyTool( a, 'solid', { x: 0, z: 204, w: 4, l: 8 } );
        expect( b.blocks ).toHaveLength( 2 );
        expect( cellCount( b.blocks ) ).toBe( 48 + 32 );
    } );

    it( 'an erase through the middle then a redraw gives back one rect', () => {
        const whole = { x: -8, z: 200, w: 16, l: 16 };
        const cut = applyTool( level( { gaps: [ whole ] } ), 'eraser', { x: -8, z: 206, w: 16, l: 4 } );
        expect( cut.gaps ).toHaveLength( 2 );
        const back = applyTool( cut, 'gap', { x: -8, z: 206, w: 16, l: 4 } );
        expect( back.gaps ).toEqual( [ whole ] );
    } );

    it( 'keeps the union exact over a random scribble', () => {
        let seed = 7;
        const rand = ( n: number ) => {
            seed = ( Math.imul( seed, 1103515245 ) + 12345 ) >>> 0;
            return seed % n;
        };
        let lvl = level();
        let want = new Set< string >();
        for ( let k = 0; k < 60; k++ ) {
            const r = { x: rand( 20 ) - 10, z: 200 + rand( 30 ), w: 1 + rand( 8 ), l: 1 + rand( 8 ) };
            const erase = rand( 3 ) === 0;
            lvl = applyTool( lvl, erase ? 'eraser' : 'gap', r );
            const drawn = cellsOf( [ r ] );
            want = erase
                ? new Set( [ ...want ].filter( ( c ) => ! drawn.has( c ) ) )
                : new Set( [ ...want, ...drawn ] );
            expect( cellsOf( lvl.gaps ) ).toEqual( want );
            expect( cellCount( lvl.gaps ) ).toBe( want.size );
        }
    } );

    it( 'kinds never merge', () => {
        const a = applyTool( level(), 'solid', { x: 0, z: 200, w: 8, l: 4 } );
        const b = applyTool( a, 'destructible', { x: 0, z: 204, w: 8, l: 4 } );
        const c = applyTool( b, 'gap', { x: 0, z: 208, w: 8, l: 4 } );
        expect( c.blocks ).toEqual( [
            { x: 0, z: 200, w: 8, l: 4, destructible: false },
            { x: 0, z: 204, w: 8, l: 4, destructible: true },
        ] );
        expect( c.gaps ).toEqual( [ { x: 0, z: 208, w: 8, l: 4 } ] );
    } );

    it( 'normalizeLevel cleans a fragmented level and keeps its fields', () => {
        const pieces = [ 0, 4, 8, 12 ].map( ( z ) => ( { x: 0, z: 200 + z, w: 4, l: 4, destructible: true } ) );
        const out = normalizeLevel( level( { name: 'kept', blocks: pieces } ) );
        expect( out.name ).toBe( 'kept' );
        expect( out.blocks ).toEqual( [ { x: 0, z: 200, w: 4, l: 16, destructible: true } ] );
    } );

    it( 'the outline of an L has no internal edge', () => {
        const segs = outlineSegments( [
            { x: 0, z: 0, w: 12, l: 4 },
            { x: 0, z: 4, w: 4, l: 8 },
        ] );
        expect( segs ).toHaveLength( 6 );
        const perimeter = segs.reduce( ( s, g ) => s + Math.abs( g.x1 - g.x0 ) + Math.abs( g.z1 - g.z0 ), 0 );
        expect( perimeter ).toBe( 2 * ( 12 + 12 ) );
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
