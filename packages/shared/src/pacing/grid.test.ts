import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    buildGrid,
    CELL_AIR,
    CELL_BLOCKED,
    CELL_GROUND,
    columnCount,
    columnX,
    freezeTrack,
    HALF_WIDTH,
    nearestColumn,
    PACING_HULL,
    PACING_HULL_L,
    SHIP_CLASSES,
    type Track,
} from '../index.js';
import { syntheticTrack, wall } from './fixture.test.js';

test( 'columns keep the contract hull on the deck', () => {
    const last = columnX( columnCount() - 1 );
    assert.ok( columnX( 0 ) - PACING_HULL >= -HALF_WIDTH - 1e-9 );
    assert.ok( last + PACING_HULL <= HALF_WIDTH + 1e-9, `last column hull reaches ${ last + PACING_HULL }` );
    assert.ok( Math.abs( columnX( nearestColumn( 0 ) ) ) < 0.5 );
} );

test( 'a cell is blocked, ground or air from the segment it samples', () => {
    const track = syntheticTrack( 3, ( s ) => {
        if ( s.index === 1 ) return { ...s, blocks: [ wall( 1, -HALF_WIDTH, 0 ) ] };
        if ( s.index === 2 ) return { ...s, kind: 'gap', floors: [] };
        return s;
    } );
    const grid = buildGrid( freezeTrack( track ) );
    const at = ( z: number, x: number ): number => grid.cells[ Math.floor( z ) * grid.cols + nearestColumn( x ) ];
    assert.equal( at( 5, 0 ), CELL_GROUND );
    assert.equal( at( 25, -10 ), CELL_BLOCKED );
    assert.equal( at( 25, 10 ), CELL_GROUND );
    assert.equal( at( 45, 0 ), CELL_AIR );
    assert.equal( grid.widest[ 25 ], HALF_WIDTH );
    assert.equal( grid.widest[ 45 ], 0 );
} );

test( 'the contract hull is as long as the freighter, so a block reaches 3u past each end', () => {
    assert.equal( 2 * PACING_HULL_L, 6 );
    assert.equal( PACING_HULL_L, SHIP_CLASSES.freighter.tuning.halfL );
    const track = syntheticTrack( 3, ( s ) => ( s.index === 1 ? { ...s, blocks: [ wall( 1, -HALF_WIDTH, 0 ) ] } : s ) );
    const grid = buildGrid( freezeTrack( track ) );
    const at = ( k: number ): number => grid.cells[ k * grid.cols + nearestColumn( -10 ) ];
    assert.equal( at( 16 ), CELL_GROUND );
    assert.equal( at( 17 ), CELL_BLOCKED );
    assert.equal( at( 42 ), CELL_BLOCKED );
    assert.equal( at( 43 ), CELL_GROUND );
} );

test( 'freezing a track builds every segment once', () => {
    let calls = 0;
    const source = syntheticTrack( 4 );
    const counted: Track = {
        ...source,
        segmentAt: ( i ) => {
            calls++;
            return source.segmentAt( i );
        },
    };
    const frozen = freezeTrack( counted );
    frozen.track.segmentAt( 2 );
    frozen.track.segmentAt( 2 );
    frozen.track.segmentAtZ( 70 );
    assert.equal( calls, 4 );
} );
