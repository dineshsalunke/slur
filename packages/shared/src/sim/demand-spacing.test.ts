import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    DEFAULT_TUNING,
    DEMAND_SPACING_PEAK_S,
    DEMAND_SPACING_REST_S,
    demandSpacingSeconds,
    demandSpacingSegments,
    intensityAt,
    procgenDescriptor,
    REACTION_WINDOW_S,
    resolveTrack,
    SEG_LEN,
    START_SAFE,
    spacingSegments,
    TRACK_SEGMENTS,
    type Track,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 99991, 7 ];

function gapEvents( t: Track ): Array< [ number, number ] > {
    const out: Array< [ number, number ] > = [];
    let cur: [ number, number ] | null = null;
    for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
        if ( t.segmentAt( i ).kind === 'gap' ) {
            if ( cur === null ) cur = [ i, i ];
            else cur[ 1 ] = i;
        } else if ( cur !== null ) {
            out.push( cur );
            cur = null;
        }
    }
    return out;
}

test( 'spacing is authored in seconds and converted with the reference cruise speed', () => {
    assert.equal( demandSpacingSeconds( 0 ), DEMAND_SPACING_REST_S );
    assert.equal( demandSpacingSeconds( 1 ), DEMAND_SPACING_PEAK_S );
    assert.equal( demandSpacingSegments( 0, SEG_LEN, DEFAULT_TUNING.maxCruise ), spacingSegments( 0 ) );
    assert.equal(
        spacingSegments( 0 ),
        Math.ceil( ( DEMAND_SPACING_REST_S * DEFAULT_TUNING.maxCruise ) / SEG_LEN ),
        'rest spacing did not follow the reference speed',
    );
} );

test( 'spacing never drops below the reaction window, whatever the intensity', () => {
    for ( let k = 0; k <= 20; k++ ) {
        assert.ok(
            demandSpacingSeconds( k / 20 ) >= REACTION_WINDOW_S - 1e-9,
            `intensity ${ k / 20 } spaces demands ${ demandSpacingSeconds( k / 20 ) }s apart`,
        );
    }
} );

test( 'a faster reference speed buys more distance for the same reaction time', () => {
    const slow = demandSpacingSegments( 0.5, SEG_LEN, 40 );
    const fast = demandSpacingSegments( 0.5, SEG_LEN, 80 );
    assert.ok( fast > slow, `${ fast } segments at 80u/s is not more than ${ slow } at 40u/s` );
} );

test( 'rest sections space demands further apart than peak sections', () => {
    assert.ok( spacingSegments( 0 ) > spacingSegments( 1 ), 'rest and peak space demands the same' );
} );

test( 'consecutive gap events keep at least the peak reaction window between them', () => {
    for ( const seed of SEEDS ) {
        const events = gapEvents( resolveTrack( procgenDescriptor( seed ) ) );
        for ( let k = 1; k < events.length; k++ ) {
            const clear = events[ k ][ 0 ] - events[ k - 1 ][ 1 ] - 1;
            const seconds = ( clear * SEG_LEN ) / DEFAULT_TUNING.maxCruise;
            assert.ok(
                seconds >= DEMAND_SPACING_PEAK_S - 1e-9,
                `seed ${ seed }: only ${ seconds.toFixed( 2 ) }s between gap events at segment ${ events[ k ][ 0 ] }`,
            );
        }
    }
} );

test( 'a rest section really does space its demands further apart than a peak one', () => {
    let restClear = 0;
    let restN = 0;
    let peakClear = 0;
    let peakN = 0;
    for ( const seed of SEEDS ) {
        const events = gapEvents( resolveTrack( procgenDescriptor( seed ) ) );
        for ( let k = 1; k < events.length; k++ ) {
            const clear = events[ k ][ 0 ] - events[ k - 1 ][ 1 ] - 1;
            if ( intensityAt( events[ k ][ 0 ], TRACK_SEGMENTS ) < 0.35 ) {
                restClear += clear;
                restN++;
            } else if ( intensityAt( events[ k ][ 0 ], TRACK_SEGMENTS ) > 0.8 ) {
                peakClear += clear;
                peakN++;
            }
        }
    }
    assert.ok( restN > 0 && peakN > 0, 'no rest or peak gap events to compare' );
    assert.ok(
        restClear / restN > peakClear / peakN,
        `rest averages ${ ( restClear / restN ).toFixed( 1 ) } clear segments, peak ${ ( peakClear / peakN ).toFixed( 1 ) }`,
    );
} );
