import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    BLOCK_DEPTH_MIN,
    blockDepthFor,
    blockZSpan,
    isHole,
    procgenDescriptor,
    resolveTrack,
    SEG_LEN,
    START_SAFE,
    TRACK_SEGMENTS,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 99991 ];

function depths( seed: number ): number[] {
    const t = resolveTrack( procgenDescriptor( seed ) );
    const out: number[] = [];
    for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
        for ( const b of t.segmentAt( i ).blocks ) out.push( b.z1 - b.z0 );
    }
    return out;
}

test( 'block depth is continuous, not a menu of a few sizes', () => {
    const seen = new Set< number >();
    for ( const seed of SEEDS ) for ( const d of depths( seed ) ) seen.add( Math.round( d * 100 ) );
    assert.ok( seen.size > 200, `only ${ seen.size } distinct depths — blocks still come in tiers` );
} );

test( 'block width is continuous, not snapped to the lane grid', () => {
    const seen = new Set< number >();
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed ) );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            for ( const b of t.segmentAt( i ).blocks ) seen.add( Math.round( ( b.x1 - b.x0 ) * 100 ) );
        }
    }
    assert.ok( seen.size > 200, `only ${ seen.size } distinct widths — blocks still snap to CELL` );
} );

test( 'no block is deeper than its segment or shallower than the floor', () => {
    const min = BLOCK_DEPTH_MIN;
    for ( const seed of SEEDS ) {
        for ( const d of depths( seed ) ) {
            assert.ok( d >= min - 1e-9, `depth ${ d } below the floor ${ min }` );
            assert.ok( d <= SEG_LEN + 1e-9, `depth ${ d } outruns SEG_LEN ${ SEG_LEN }` );
        }
    }
} );

test( 'blocks no longer all share one centred z-offset', () => {
    const offsets = new Set< number >();
    const t = resolveTrack( procgenDescriptor( 1234 ) );
    for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
        const s = t.segmentAt( i );
        if ( isHole( s ) ) continue;
        for ( const b of s.blocks ) offsets.add( Math.round( ( b.z0 - s.z0 ) * 100 ) );
    }
    assert.ok( offsets.size > 10, `only ${ offsets.size } distinct z-offsets — blocks still sit on one slice` );
} );

test( 'depth selection is a pure function of the draw and the intensity', () => {
    for ( const u of [ 0, 0.25, 0.5, 0.75, 0.999 ] ) {
        for ( const intensity of [ 0, 0.5, 1 ] ) {
            assert.equal( blockDepthFor( u, intensity, SEG_LEN ), blockDepthFor( u, intensity, SEG_LEN ) );
        }
    }
} );

test( 'deep blocks get commoner as intensity rises', () => {
    const mean = ( intensity: number ): number => {
        let sum = 0;
        for ( let k = 0; k < 1000; k++ ) sum += blockDepthFor( k / 1000, intensity, SEG_LEN );
        return sum / 1000;
    };
    assert.ok(
        mean( 1 ) > mean( 0 ) * 1.5,
        `mean depth ${ mean( 1 ) } at peak is not well above ${ mean( 0 ) } at rest`,
    );
} );

test( 'a z-span is deterministic and never leaves its segment', () => {
    for ( const seed of SEEDS ) {
        for ( let i = 0; i < 200; i++ ) {
            const z0 = i * SEG_LEN;
            const [ a0, a1 ] = blockZSpan( seed, i, 3, z0, SEG_LEN, 0.4 );
            const [ b0, b1 ] = blockZSpan( seed, i, 3, z0, SEG_LEN, 0.4 );
            assert.equal( a0, b0 );
            assert.equal( a1, b1 );
            assert.ok( a0 >= z0 - 1e-9 && a1 <= z0 + SEG_LEN + 1e-9, `span ${ a0 }..${ a1 } outside segment ${ i }` );
        }
    }
} );

test( 'a shallower segment clamps every tier to fit', () => {
    for ( const u of [ 0.1, 0.5, 0.9 ] ) assert.ok( blockDepthFor( u, 1, 5 ) <= 5 );
} );
