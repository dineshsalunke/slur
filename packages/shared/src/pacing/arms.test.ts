import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    airDistance,
    analyzeArms,
    analyzeDescriptor,
    analyzeRoutes,
    buildGrid,
    DEFAULT_TUNING,
    freezeTrack,
    HALF_WIDTH,
    maxColumnStep,
    procgenDescriptor,
    referencePath,
    type Segment,
    TRACK_CONTRACT,
    type Track,
} from '../index.js';
import { syntheticTrack, wall } from './fixture.test.js';

const CRUISE = TRACK_CONTRACT.pacingCruise;
const STEP = maxColumnStep( CRUISE );
const AIR = airDistance( DEFAULT_TUNING, 'double' );

function armsOf( track: Track ) {
    const frozen = freezeTrack( track );
    const grid = buildGrid( frozen );
    const routes = analyzeRoutes( frozen, grid, AIR, STEP );
    const path = referencePath( grid, CRUISE, AIR );
    return analyzeArms( frozen, grid, routes, path, DEFAULT_TUNING, CRUISE );
}

function forkTrack( edit: ( s: Segment ) => Segment = ( s ) => s ): Track {
    return syntheticTrack( 14, ( s ) => {
        if ( s.index < 5 || s.index > 8 ) return s;
        const out = edit( s );
        return { ...out, blocks: [ wall( s.index, -6, 6 ), ...out.blocks ] };
    } );
}

test( 'two mirror arms measure the same and neither is dominated', () => {
    const { forks } = armsOf( forkTrack() );
    assert.equal( forks.length, 1 );
    const [ left, right ] = forks[ 0 ].arms;
    assert.equal( left.lateral, right.lateral );
    assert.equal( left.dominated, false );
    assert.equal( right.dominated, false );
} );

test( 'a weave in one arm makes it the hard arm, and the named routes take opposite arms', () => {
    const track = forkTrack( ( s ) => {
        if ( s.index === 6 ) return { ...s, blocks: [ wall( 6, 6, 22 ) ] };
        if ( s.index === 8 ) return { ...s, blocks: [ wall( 8, 16, HALF_WIDTH ) ] };
        return s;
    } );
    const { forks, easiest, hardest } = armsOf( track );
    assert.equal( forks.length, 1 );
    const f = forks[ 0 ];
    const woven = f.arms.findIndex( ( a ) => a.lateral > 0 );
    const plain = 1 - woven;
    assert.ok( woven >= 0, 'one arm needs lateral travel' );
    assert.equal( f.arms[ plain ].lateral, 0 );
    assert.equal( f.arms[ woven ].dominated, true );
    assert.equal( f.arms[ plain ].dominated, false );
    assert.equal( f.hardest, woven );
    assert.equal( f.easiest, plain );
    assert.deepEqual( easiest.choice, [ plain ] );
    assert.deepEqual( hardest.choice, [ woven ] );
    assert.equal( hardest.barred, 0 );
    assert.ok( hardest.lateral > easiest.lateral );
} );

test( 'a hole in one arm only is an optional gap on that arm', () => {
    const track = forkTrack( ( s ) =>
        s.index === 7
            ? {
                  ...s,
                  floors: [
                      { x0: -HALF_WIDTH, x1: 6, y: 0 },
                      { x0: 6, x1: HALF_WIDTH, y: 0, z0: s.z0 + 12, z1: s.z1 },
                  ],
              }
            : s,
    );
    const { forks } = armsOf( track );
    assert.equal( forks.length, 1 );
    const jumped = forks[ 0 ].arms.filter( ( a ) => a.jumps > 0 );
    assert.equal( jumped.length, 1 );
    assert.equal( jumped[ 0 ].gaps.length, 1 );
    assert.equal( jumped[ 0 ].gaps[ 0 ].forced, false );
    assert.ok( jumped[ 0 ].gaps[ 0 ].holeLen >= 12 );
    assert.equal( forks[ 0 ].hardest, forks[ 0 ].arms.indexOf( jumped[ 0 ] ) );
} );

test( 'on the seed track every arm and both named routes thread without a stuck sample', () => {
    const r = analyzeDescriptor( procgenDescriptor( 20260921 ), { arms: true } );
    assert.ok( r.arms !== null && r.routes !== null );
    const { forks, easiest, hardest } = r.arms;
    assert.equal( forks.length, r.routes.forks.filter( ( f ) => f.kind === 'fork' ).length );
    assert.equal( easiest.path, r.path );
    assert.equal( easiest.stuck, 0 );
    assert.equal( hardest.stuck, 0 );
    assert.ok( hardest.lateral >= easiest.lateral );
    for ( const f of forks ) for ( const a of f.arms ) assert.equal( a.stuck + a.barred, 0 );
} );
