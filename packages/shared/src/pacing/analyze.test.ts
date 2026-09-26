import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeDescriptor, PACING_JUMP_SOURCE, procgenDescriptor, TRACK_CONTRACT } from '../index.js';

const SEEDS = [ 20260921, 1, 42 ];

test( 'the report runs on pacing time and names where its jump numbers come from', () => {
    const r = analyzeDescriptor( procgenDescriptor( SEEDS[ 0 ], 'weave' ) );
    assert.equal( r.cruise, TRACK_CONTRACT.pacingCruise );
    assert.equal( r.duration, r.finishZ / TRACK_CONTRACT.pacingCruise );
    assert.equal( r.jump.source, PACING_JUMP_SOURCE );
    assert.ok( r.intent !== null );
} );

test( 'the same descriptor always gives the same report', () => {
    const a = analyzeDescriptor( procgenDescriptor( SEEDS[ 1 ], 'weave' ) );
    const b = analyzeDescriptor( procgenDescriptor( SEEDS[ 1 ], 'weave' ) );
    assert.deepEqual( Array.from( a.path.x ), Array.from( b.path.x ) );
    assert.deepEqual( a.gaps, b.gaps );
    assert.deepEqual( a.demand.bins, b.demand.bins );
} );

test( 'the reference path threads every sampled seed without a stuck sample', () => {
    for ( const seed of SEEDS ) {
        const r = analyzeDescriptor( procgenDescriptor( seed, 'weave' ) );
        const stuck = r.path.stuck.reduce( ( s, v ) => s + v, 0 );
        assert.equal( stuck, 0, `seed ${ seed } has ${ stuck } stuck samples` );
    }
} );
