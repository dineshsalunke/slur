import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { type Anchor, LEAD_SEGMENTS, type Segment, TRACK_GENS, type TrackGen } from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const DIGEST_SEEDS = [ 1, 7, 42, 1337, 24301 ];

const FROZEN: Partial< Record< TrackGen, Record< number, string > > > = {
    weave: {
        1: 'c78e794b40a4db08',
        7: '4bf512943bec56be',
        42: 'e50cf66a6f0bda87',
        1337: 'c980d5acb52c8ac9',
        24301: '9fd8eac3611abecf',
    },
    groove: {
        1: '3d86632aac77f5d7',
        7: 'd0f36c4545f37a8c',
        42: '9c621d5604ce962b',
        1337: '7c616791fa3b1370',
        24301: 'c04d9939218a97d6',
    },
    phrase: {
        1: '94fdb6d9d4f025f7',
        7: '3ac2af3dabf321d0',
        42: '5d86fa6c7b7a0b0c',
        1337: 'bb439e4feba9a8f1',
        24301: '1a1a1511d8379d98',
    },
};

function segmentLine( s: Segment ): string {
    const floors = s.floors.map( ( f ) => [ f.x0, f.x1, f.y, f.z0 ?? '-', f.z1 ?? '-' ].join( ',' ) );
    const blocks = s.blocks.map( ( b ) => [ b.id, b.kind, b.x0, b.x1, b.y0, b.y1, b.z0, b.z1 ].join( ',' ) );
    return [ s.index, s.z0, s.z1, s.kind, s.isFinish, floors.join( ';' ), blocks.join( ';' ) ].join( '|' );
}

function anchorLine( a: Anchor ): string {
    return [ a.id, a.kind, a.x, a.y, a.z, JSON.stringify( a.params ?? null ) ].join( '|' );
}

function trackDigest( gen: TrackGen, seed: number ): string {
    const descriptor = procgenDescriptor( seed, gen );
    const length = descriptor.kind === 'procgen' ? descriptor.length : 0;
    const track = resolveTrack( descriptor );
    const hash = createHash( 'sha256' );
    for ( let i = -LEAD_SEGMENTS - 2; i < length + 2; i++ ) hash.update( `${ segmentLine( track.segmentAt( i ) ) }\n` );
    hash.update( `finish ${ track.finishZ }\n` );
    for ( const a of track.anchors ) hash.update( `${ anchorLine( a ) }\n` );
    return hash.digest( 'hex' ).slice( 0, 16 );
}

for ( const gen of TRACK_GENS ) {
    const frozen = FROZEN[ gen ];
    if ( frozen === undefined ) continue;
    test( `${ gen } geometry matches its frozen digest on every fixed seed`, () => {
        const actual = Object.fromEntries( DIGEST_SEEDS.map( ( seed ) => [ seed, trackDigest( gen, seed ) ] ) );
        assert.deepEqual( actual, frozen );
    } );
}
