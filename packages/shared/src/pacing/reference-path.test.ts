import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    buildGrid,
    freezeTrack,
    HALF_WIDTH,
    maxColumnStep,
    PACING_DX,
    PACING_DZ,
    PACING_HULL,
    referencePath,
    TRACK_CONTRACT,
} from '../index.js';
import { syntheticTrack, wall } from './fixture.test.js';

const CRUISE = TRACK_CONTRACT.pacingCruise;

test( 'one column step per sample is exactly the contract strafe clamp', () => {
    const rate = ( maxColumnStep( CRUISE ) * PACING_DX * CRUISE ) / PACING_DZ;
    assert.ok( Math.abs( rate - TRACK_CONTRACT.weaveStrafeClamp ) < 1e-9, `planner strafes at ${ rate }u/s` );
} );

test( 'the path threads a wall through its hole and holds still once past it', () => {
    const track = syntheticTrack( 6, ( s ) =>
        s.index === 3 ? { ...s, blocks: [ wall( 3, -HALF_WIDTH, 12 ), wall( 3, 24, HALF_WIDTH ) ] } : s,
    );
    const path = referencePath( buildGrid( freezeTrack( track ) ), CRUISE, 0 );
    const through = path.x[ 70 ];
    assert.ok( through - PACING_HULL >= 12 && through + PACING_HULL <= 24, `path crossed the wall at x ${ through }` );
    assert.equal( path.x[ 85 ], path.x[ 119 ] );
    assert.equal(
        path.stuck.reduce( ( a, b ) => a + b, 0 ),
        0,
    );
} );

test( 'a hole longer than the air limit is flagged stuck, a shorter one is jumped', () => {
    const track = syntheticTrack( 5, ( s ) => ( s.index === 2 ? { ...s, kind: 'gap', floors: [] } : s ) );
    const grid = buildGrid( freezeTrack( track ) );
    const jumped = referencePath( grid, CRUISE, 30 );
    assert.equal(
        jumped.stuck.reduce( ( a, b ) => a + b, 0 ),
        0,
    );
    assert.equal( jumped.air[ 50 ], 1 );
    const short = referencePath( grid, CRUISE, 10 );
    assert.ok( short.stuck.reduce( ( a, b ) => a + b, 0 ) > 0 );
} );
