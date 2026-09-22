import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeProcgenTrack, type ProcgenDescriptor, START_SAFE } from '../index.js';

const BASE: ProcgenDescriptor = { kind: 'procgen', seed: 20260921, tier: 0, length: 200 };

function countSegments( d: ProcgenDescriptor ): { blocks: number; gaps: number } {
    const track = makeProcgenTrack( d );
    let blocks = 0;
    let gaps = 0;
    for ( let i = START_SAFE; i < ( d.length ?? 0 ); i++ ) {
        const seg = track.segmentAt( i );
        blocks += seg.blocks.length;
        if ( seg.kind === 'gap' ) gaps++;
    }
    return { blocks, gaps };
}

test( 'an unset descriptor generates the same track as an explicit full density', () => {
    const implicit = countSegments( BASE );
    const explicit = countSegments( { ...BASE, blockDensity: 1, gapChance: 1 } );
    assert.deepEqual( implicit, explicit );
} );

test( 'zero density removes every block and gap', () => {
    const { blocks, gaps } = countSegments( { ...BASE, blockDensity: 0, gapChance: 0 } );
    assert.equal( blocks, 0 );
    assert.equal( gaps, 0 );
} );

test( 'the knobs are independent', () => {
    const full = countSegments( BASE );
    const noBlocks = countSegments( { ...BASE, blockDensity: 0 } );
    const noGaps = countSegments( { ...BASE, gapChance: 0 } );
    assert.equal( noBlocks.blocks, 0 );
    assert.ok( noBlocks.gaps > 0 );
    assert.equal( noGaps.gaps, 0 );
    assert.ok( noGaps.blocks > 0 );
    assert.ok( full.blocks > 0 && full.gaps > 0 );
} );

test( 'lowering a knob never adds geometry', () => {
    const full = countSegments( BASE );
    const half = countSegments( { ...BASE, blockDensity: 0.5, gapChance: 0.5 } );
    assert.ok( half.blocks <= full.blocks );
    assert.ok( half.gaps <= full.gaps );
} );

test( 'a descriptor generates identical geometry on both ends', () => {
    const d: ProcgenDescriptor = { ...BASE, blockDensity: 0.4, gapChance: 0.7 };
    const a = makeProcgenTrack( d );
    const b = makeProcgenTrack( d );
    for ( let i = START_SAFE; i < 200; i++ ) {
        assert.deepEqual( a.segmentAt( i ), b.segmentAt( i ) );
    }
} );
