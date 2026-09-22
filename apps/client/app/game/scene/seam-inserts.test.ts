import { type FloorSpan, HALF_WIDTH, LEAD_SEGMENTS, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    buildSeamGeometry,
    buildSeamInserts,
    SEAM_INSET,
    SEAM_LEN_MAX,
    SEAM_LEN_MIN,
    SEAM_LIFT,
    SEAM_SPACING,
    SEAM_WIDTH,
    seamLanes,
} from './seam-inserts';

const full = (): FloorSpan[] => [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ];

function segmentOf( f: FloorSpan[], i: number ): Segment {
    return {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: f.length > 0 ? 'plain' : 'gap',
        floors: f,
        blocks: [],
        isFinish: false,
    };
}

function trackOf( floors: FloorSpan[][] ): Track {
    const lead: FloorSpan[][] = Array.from( { length: LEAD_SEGMENTS }, full );
    const segs: Segment[] = [ ...lead, ...floors ].map( ( f, i ) => segmentOf( f, i - LEAD_SEGMENTS ) );
    const at = ( i: number ) => segs[ i + LEAD_SEGMENTS ] ?? segmentOf( [], i );
    return {
        finishZ: floors.length * SEG_LEN,
        anchors: [],
        segmentAt: at,
        segmentAtZ: ( z: number ) => at( Math.floor( z / SEG_LEN ) ),
    };
}

const plain = ( n: number ) => trackOf( Array.from( { length: n }, full ) );

describe( 'seam lanes', () => {
    it( 'mirrors every lane and keeps them all inboard of the rail', () => {
        const xs = seamLanes( HALF_WIDTH );

        for ( const x of xs ) {
            expect( xs ).toContain( -x );
            expect( Math.abs( x ) ).toBeLessThan( HALF_WIDTH );
        }
    } );

    it( 'starts at the inset and steps by the spacing', () => {
        const xs = seamLanes( HALF_WIDTH )
            .filter( ( x ) => x > 0 )
            .sort( ( a, b ) => a - b );

        expect( xs[ 0 ] ).toBe( SEAM_INSET );
        for ( let i = 1; i < xs.length; i++ ) expect( xs[ i ] - xs[ i - 1 ] ).toBe( SEAM_SPACING );
    } );
} );

describe( 'ADR-012 — no drawn element takes playable width', () => {
    it( 'keeps every seam quad inboard of the track edge', () => {
        const p = buildSeamGeometry( buildSeamInserts( plain( 40 ), 40, HALF_WIDTH ) ).getAttribute( 'position' );

        for ( let i = 0; i < p.count; i++ ) expect( Math.abs( p.getX( i ) ) ).toBeLessThanOrEqual( HALF_WIDTH );
    } );
} );

describe( 'seam inserts', () => {
    it( 'is sparse — far fewer inserts than lanes × segments', () => {
        const segments = 40;
        const inserts = buildSeamInserts( plain( segments ), segments, HALF_WIDTH );
        const slots = ( segments + LEAD_SEGMENTS ) * seamLanes( HALF_WIDTH ).length;

        expect( inserts.length ).toBeGreaterThan( 0 );
        expect( inserts.length ).toBeLessThan( slots );
    } );

    it( 'varies length inside the authored range', () => {
        const inserts = buildSeamInserts( plain( 40 ), 40, HALF_WIDTH );
        const lengths = inserts.map( ( s ) => s.z1 - s.z0 );

        for ( const len of lengths ) {
            expect( len ).toBeGreaterThanOrEqual( SEAM_LEN_MIN );
            expect( len ).toBeLessThanOrEqual( SEAM_LEN_MAX );
        }
        expect( new Set( lengths.map( ( l ) => l.toFixed( 3 ) ) ).size ).toBeGreaterThan( 1 );
    } );

    it( 'never leaves the segment that authored it', () => {
        const segments = 40;
        const track = plain( segments );

        for ( const s of buildSeamInserts( track, segments, HALF_WIDTH ) ) {
            const seg = track.segmentAtZ( s.z0 );
            expect( s.z0 ).toBeGreaterThanOrEqual( seg.z0 - 1e-6 );
            expect( s.z1 ).toBeLessThanOrEqual( seg.z1 + 1e-6 );
        }
    } );

    it( 'draws nothing over a gap', () => {
        const floors = Array.from( { length: 6 }, full );
        floors[ 3 ] = [];
        const track = trackOf( floors );

        for ( const s of buildSeamInserts( track, 6, HALF_WIDTH ) ) {
            expect( track.segmentAtZ( s.z0 ).kind ).not.toBe( 'gap' );
        }
    } );

    it( 'is deterministic for the same track', () => {
        const a = buildSeamInserts( plain( 20 ), 20, HALF_WIDTH );
        const b = buildSeamInserts( plain( 20 ), 20, HALF_WIDTH );

        expect( a ).toEqual( b );
    } );
} );

describe( 'seam geometry', () => {
    it( 'lays every quad flat above its floor, one seam width across', () => {
        const inserts = buildSeamInserts( plain( 20 ), 20, HALF_WIDTH );
        const geo = buildSeamGeometry( inserts );
        const p = geo.getAttribute( 'position' );
        const n = geo.getAttribute( 'normal' );

        for ( let i = 0; i < p.count; i++ ) {
            expect( p.getY( i ) ).toBeCloseTo( SEAM_LIFT );
            expect( n.getY( i ) ).toBeGreaterThan( 0.9 );
        }

        const first = inserts[ 0 ];
        const xs = [];
        for ( let i = 0; i < 6; i++ ) xs.push( p.getX( i ) );
        expect( Math.max( ...xs ) - Math.min( ...xs ) ).toBeCloseTo( SEAM_WIDTH );
        expect( ( Math.max( ...xs ) + Math.min( ...xs ) ) / 2 ).toBeCloseTo( first.x );
    } );
} );
