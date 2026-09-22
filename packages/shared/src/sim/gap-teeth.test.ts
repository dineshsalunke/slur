import assert from 'node:assert/strict';
import test from 'node:test';
import { CELL } from '../constants.js';
import { passableCorridorWidth } from './clearance.js';
import { rimTeeth, TOOTH_MAX_ROWS } from './gap-teeth.js';
import { isFullSpan, isHole, LANES, SEG_LEN, type Segment, spanZ0, spanZ1, TRACK_SEGMENTS, ZCELLS } from './space.js';
import { makeProcgenTrack } from './track.js';

const HOLE = [ { lo: 0, hi: LANES - 1 } ];

function gapSegments( seed: number, length = 120 ): Segment[] {
    const track = makeProcgenTrack( { kind: 'procgen', seed, tier: 0, length } );
    const out: Segment[] = [];
    for ( let i = 0; i < length; i++ ) {
        const seg = track.segmentAt( i );
        if ( seg.kind === 'gap' ) out.push( seg );
    }
    return out;
}

test( 'rim teeth never claim the same lane on both rims', () => {
    for ( let seed = 0; seed < 400; seed++ ) {
        const owner = new Map< number, boolean >();
        for ( const t of rimTeeth( seed, 7, HOLE, ZCELLS ) ) {
            for ( let lane = t.lo; lane <= t.hi; lane++ ) {
                assert.equal( owner.has( lane ), false, `lane ${ lane } claimed twice at seed ${ seed }` );
                owner.set( lane, t.front );
            }
        }
    }
} );

test( 'rim teeth are shallow enough to leave the hole open', () => {
    for ( let seed = 0; seed < 400; seed++ ) {
        for ( const t of rimTeeth( seed, 3, HOLE, ZCELLS ) ) {
            assert.ok( t.rows >= 1 && t.rows <= TOOTH_MAX_ROWS );
            assert.ok( t.rows < ZCELLS );
        }
    }
} );

test( 'rim teeth are deterministic for a seed and segment', () => {
    assert.deepEqual( rimTeeth( 99, 12, HOLE, ZCELLS ), rimTeeth( 99, 12, HOLE, ZCELLS ) );
} );

test( 'gap teeth touch a rim, never bridge the gap', () => {
    for ( let seed = 0; seed < 60; seed++ ) {
        for ( const seg of gapSegments( seed ) ) {
            for ( const f of seg.floors ) {
                if ( isFullSpan( f ) ) continue;
                const z0 = spanZ0( seg, f );
                const z1 = spanZ1( seg, f );
                const atRim = Math.abs( z0 - seg.z0 ) < 1e-4 || Math.abs( z1 - seg.z1 ) < 1e-4;
                assert.ok( atRim, `tooth off the rim in seg ${ seg.index }` );
                assert.ok( z1 - z0 <= TOOTH_MAX_ROWS * CELL + 1e-4 );
                assert.ok( z1 - z0 < SEG_LEN );
            }
        }
    }
} );

test( 'a toothed gap is still a hole with no passable corridor', () => {
    let toothed = 0;
    for ( let seed = 0; seed < 60; seed++ ) {
        for ( const seg of gapSegments( seed ) ) {
            if ( seg.floors.some( isFullSpan ) ) continue;
            if ( seg.floors.length > 0 ) toothed++;
            assert.equal( isHole( seg ), true );
            assert.equal( passableCorridorWidth( seg ), 0 );
        }
    }
    assert.ok( toothed > 0, 'no full gap grew teeth across 60 seeds' );
} );

test( 'teeth never overlap the corridor deck of a partial gap', () => {
    for ( let seed = 0; seed < 60; seed++ ) {
        for ( const seg of gapSegments( seed, TRACK_SEGMENTS / 4 ) ) {
            const deck = seg.floors.filter( isFullSpan );
            for ( const f of seg.floors ) {
                if ( isFullSpan( f ) ) continue;
                for ( const d of deck ) {
                    assert.ok( f.x1 <= d.x0 + 1e-4 || f.x0 >= d.x1 - 1e-4 );
                }
            }
        }
    }
} );
