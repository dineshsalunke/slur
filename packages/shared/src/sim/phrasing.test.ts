import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    DEFAULT_TUNING,
    intensityAt,
    isHole,
    passableCorridorWidth,
    procgenDescriptor,
    REST_INTENSITY,
    resolveTrack,
    restScale,
    SECTIONS,
    SEG_LEN,
    START_SAFE,
    TRACK_SEGMENTS,
    type Track,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 99991, 7 ];

const DEMAND_WIDTH = 28;

function busy( t: Track, i: number ): boolean {
    const s = t.segmentAt( i );
    return s.kind === 'gap' || passableCorridorWidth( s ) < DEMAND_WIDTH;
}

function longestRest( t: Track ): number {
    let best = 0;
    let run = 0;
    for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
        if ( busy( t, i ) ) run = 0;
        else if ( ++run > best ) best = run;
    }
    return best;
}

test( 'a rest section really empties out, not just thins', () => {
    assert.equal( restScale( 0 ), 0 );
    assert.equal( restScale( REST_INTENSITY ), 1 );
    assert.ok( restScale( REST_INTENSITY / 2 ) < 1, 'below the rest floor nothing is scaled down' );
    assert.ok( restScale( 1 ) === 1, 'the rest floor is still scaling at full intensity' );
} );

test( 'every track carries a real breather, measured in seconds', () => {
    for ( const seed of SEEDS ) {
        const rest = longestRest( resolveTrack( procgenDescriptor( seed ) ) );
        const seconds = ( rest * SEG_LEN ) / DEFAULT_TUNING.maxCruise;
        assert.ok( seconds >= 2, `seed ${ seed }: longest breather is only ${ seconds.toFixed( 1 ) }s` );
    }
} );

test( 'the envelope is phrased rest / build / spike / release, not a smooth ramp', () => {
    const rests = SECTIONS.filter( ( s ) => Math.max( s.i0, s.i1 ) <= REST_INTENSITY );
    const spikes = SECTIONS.filter( ( s ) => Math.min( s.i0, s.i1 ) >= 0.78 );
    assert.ok( rests.length >= 2, `only ${ rests.length } sections sit at or below the rest floor` );
    assert.ok( spikes.length >= 3, `only ${ spikes.length } spike sections` );
    const restFloor = Math.min( ...rests.map( ( r ) => r.weight ) );
    for ( const s of spikes ) {
        if ( s.name === 'finalcho' ) continue;
        assert.ok( s.weight <= restFloor, `spike ${ s.name } (weight ${ s.weight }) is not shorter than every rest` );
    }
    const final = SECTIONS.find( ( s ) => s.name === 'finalcho' );
    assert.ok( final !== undefined && final.weight > restFloor, 'the final chorus is not the biggest one' );
} );

test( 'the bridge valley sits around three quarters of the way in', () => {
    const total = SECTIONS.reduce( ( sum, s ) => sum + s.weight, 0 );
    let acc = 0;
    for ( const s of SECTIONS ) {
        if ( s.name === 'bridge' ) {
            assert.ok( acc / total > 0.6 && acc / total < 0.85, `bridge starts at ${ ( acc / total ).toFixed( 2 ) }` );
            assert.ok( Math.min( s.i0, s.i1 ) <= REST_INTENSITY, 'the bridge is not a real breakdown valley' );
            return;
        }
        acc += s.weight;
    }
    assert.fail( 'no bridge section in the arrangement envelope' );
} );

test( 'the run ends on a plain finish and peaks before it', () => {
    const last = SECTIONS[ SECTIONS.length - 1 ];
    assert.ok( last.i1 <= 0.1, `the outro ends at intensity ${ last.i1 }, not a plain finish` );
    assert.ok( Math.max( ...SECTIONS.map( ( s ) => Math.max( s.i0, s.i1 ) ) ) >= 0.96, 'nothing reaches a full peak' );
} );

function busyShare( lo: number, hi: number ): { share: number; n: number } {
    let busyN = 0;
    let n = 0;
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed ) );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const intensity = intensityAt( i, TRACK_SEGMENTS );
            if ( intensity < lo || intensity > hi ) continue;
            n++;
            if ( busy( t, i ) ) busyN++;
        }
    }
    return { share: n === 0 ? 0 : busyN / n, n };
}

test( 'spike stretches really are tighter than rest stretches', () => {
    const rest = busyShare( 0, REST_INTENSITY );
    const spike = busyShare( 0.8, 1 );
    assert.ok( rest.n > 0 && spike.n > 0, 'the envelope has no rest or no spike stretch' );
    assert.ok(
        spike.share > 3 * rest.share,
        `spike ${ spike.share.toFixed( 2 ) } is not three times rest ${ rest.share.toFixed( 2 ) }`,
    );
} );

test( 'a rest stretch still keeps its floor — a breather is flat, not a hole', () => {
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed ) );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            if ( intensityAt( i, TRACK_SEGMENTS ) > 0.06 ) continue;
            const s = t.segmentAt( i );
            if ( isHole( s ) ) continue;
            assert.ok( s.floors.length > 0, `seed ${ seed } seg ${ i }: a breather with no floor` );
        }
    }
} );
