import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    airDistance,
    airRunLengths,
    analyzeDescriptor,
    analyzeRoutes,
    type Block,
    buildGrid,
    DEFAULT_TUNING,
    FORK_MIN_ARM_U,
    FORK_MIN_SEPARATION_U,
    freezeTrack,
    HALF_WIDTH,
    legalMask,
    maxColumnStep,
    nearestColumn,
    procgenDescriptor,
    SEG_LEN,
    TRACK_CONTRACT,
    type Track,
} from '../index.js';
import { syntheticTrack, wall } from './fixture.test.js';

const STEP = maxColumnStep( TRACK_CONTRACT.pacingCruise );
const AIR = airDistance( DEFAULT_TUNING, 'double' );

function routesOf( track: Track ) {
    const frozen = freezeTrack( track );
    const grid = buildGrid( frozen );
    return { grid, routes: analyzeRoutes( frozen, grid, AIR, STEP ) };
}

function fractured( i: number, x0: number, x1: number ): Block {
    return { ...wall( i, x0, x1 ), id: i * 64 + 1, kind: 'fractured' };
}

test( 'a pillar shorter than the reaction distance is a dodge; a long one is a fork', () => {
    const track = syntheticTrack( 12, ( s ) => {
        if ( s.index === 2 ) return { ...s, blocks: [ { ...wall( 2, -1, 1 ), z1: 2 * SEG_LEN + 8 } ] };
        if ( s.index >= 5 && s.index <= 7 ) return { ...s, blocks: [ wall( s.index, -6, 6 ) ] };
        return s;
    } );
    const { forks } = routesOf( track ).routes;
    assert.deepEqual(
        forks.map( ( f ) => [ f.kind, f.arms.length ] ),
        [
            [ 'dodge', 2 ],
            [ 'fork', 2 ],
        ],
    );
    assert.ok( forks[ 0 ].length < FORK_MIN_ARM_U );
    assert.ok( forks[ 1 ].length >= 3 * SEG_LEN );
    assert.ok( forks[ 1 ].separation >= FORK_MIN_SEPARATION_U );
} );

test( 'a fractured block opens a conditional region that the base graph lacks', () => {
    const track = syntheticTrack( 8, ( s ) =>
        s.index === 4 ? { ...s, blocks: [ wall( 4, -HALF_WIDTH, -10 ), fractured( 4, -10, 10 ) ] } : s,
    );
    const { conditional } = routesOf( track ).routes;
    const hit = conditional.find( ( r ) => r.k0 <= 4 * SEG_LEN && r.k1 >= 5 * SEG_LEN - 1 && r.x0 <= 0 && r.x1 >= 0 );
    assert.ok( hit !== undefined, JSON.stringify( conditional ) );
} );

test( 'a long lengthwise crack is crossable sideways, not a wall', () => {
    const track = syntheticTrack( 10, ( s ) =>
        s.index >= 2 && s.index <= 6
            ? {
                  ...s,
                  floors: [
                      { x0: -HALF_WIDTH, x1: -1, y: 0 },
                      { x0: 1, x1: HALF_WIDTH, y: 0 },
                  ],
              }
            : s,
    );
    const { grid } = routesOf( track );
    const i = 90 * grid.cols + nearestColumn( 0 );
    assert.ok( airRunLengths( grid )[ i ] > AIR, 'the crack is longer than one double jump' );
    assert.equal( legalMask( grid, AIR, STEP )[ i ], 1 );
} );

test( 'the seed track threads end to end and offers at least one real fork', () => {
    const { routes } = analyzeDescriptor( procgenDescriptor( 20260921, 'weave' ), { routes: true } );
    assert.ok( routes !== null );
    const empty = routes.corridors.indexOf( 0 );
    assert.equal( empty, -1, `no viable corridor at z ${ empty }` );
    assert.ok( routes.forks.some( ( f ) => f.kind === 'fork' ) );
} );
