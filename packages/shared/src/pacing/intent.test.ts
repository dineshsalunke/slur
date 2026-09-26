import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    intensityAt,
    procgenDescriptor,
    procgenIntent,
    resolveTrack,
    SECTIONS,
    START_SAFE,
    sectionSpans,
    TRACK_SEGMENTS,
} from '../index.js';

test( 'sections tile the racing segments in order with no gap or overlap', () => {
    const spans = sectionSpans( TRACK_SEGMENTS );
    assert.deepEqual(
        spans.map( ( s ) => s.name ),
        SECTIONS.map( ( s ) => s.name ),
    );
    assert.equal( spans[ 0 ].i0, START_SAFE );
    assert.equal( spans[ spans.length - 1 ].i1, TRACK_SEGMENTS - 1 );
    for ( let n = 1; n < spans.length; n++ ) assert.equal( spans[ n ].i0, spans[ n - 1 ].i1 + 1 );
} );

test( 'each section span holds the segments intensityAt ramps inside it', () => {
    for ( const s of sectionSpans( TRACK_SEGMENTS ) ) {
        const lo = Math.min( s.from, s.to ) - 1e-6;
        const hi = Math.max( s.from, s.to ) + 1e-6;
        for ( let i = s.i0; i <= s.i1; i++ ) {
            const v = intensityAt( i, TRACK_SEGMENTS );
            assert.ok( v >= lo && v <= hi, `${ s.name } segment ${ i } has intensity ${ v }` );
        }
    }
} );

test( 'intent carries the intensity curve and a band for every non-gap racing segment', () => {
    const d = procgenDescriptor( 20260921, 'weave' );
    const track = resolveTrack( d );
    const segments = Array.from( { length: TRACK_SEGMENTS }, ( _, i ) => track.segmentAt( i ) );
    if ( d.kind !== 'procgen' ) throw new Error( 'expected a procgen descriptor' );
    const intent = procgenIntent( d, segments );
    for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
        assert.ok( Math.abs( intent.intensity[ i ] - intensityAt( i, TRACK_SEGMENTS ) ) < 1e-6 );
        const expectBand = i >= START_SAFE && segments[ i ].kind !== 'gap';
        assert.equal( intent.bands[ i ] !== null, expectBand, `segment ${ i }` );
    }
} );
