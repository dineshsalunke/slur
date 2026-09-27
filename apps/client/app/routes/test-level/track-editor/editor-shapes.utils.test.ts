import {
    decompileTrack,
    forgetAuthoredLevel,
    registerAuthoredLevel,
    resolveTrack,
    SEG_LEN,
    type Track,
} from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { testLevelDescriptor } from '../test-level-canvas/test-level-canvas.utils';
import { normalizeLevel, unionRects } from './editor-shapes.utils';

function blockCount( track: Track ): number {
    let n = 0;
    for ( let i = 0; i * SEG_LEN < track.finishZ; i++ ) n += track.segmentAt( i ).blocks.length;
    return n;
}

describe( 'normalizeLevel', () => {
    it( 'keeps a decompiled phrase track at its generated block count', () => {
        const generated = resolveTrack( testLevelDescriptor( 'phrase' ) );
        const id = 'normalize-phrase-318';
        const level = normalizeLevel(
            decompileTrack( generated, { id, name: id, source: { gen: 'phrase', seed: 0 } } ),
        );
        registerAuthoredLevel( level );
        try {
            const saved = resolveTrack( { kind: 'authored', levelId: id } );
            expect( blockCount( saved ) ).toBeLessThanOrEqual( blockCount( generated ) );
        } finally {
            forgetAuthoredLevel( id );
        }
    } );
} );

describe( 'unionRects', () => {
    it( 'keeps a long wall whole when blocks butt against its side', () => {
        const wall = { x: 10, z: 0, w: 14, l: 400 };
        const posts = [ 40, 120, 260 ].map( ( z ) => ( { x: 24, z, w: 4, l: 8 } ) );
        expect( unionRects( [ wall, ...posts ] ) ).toEqual( [ wall, ...posts ] );
    } );
} );
