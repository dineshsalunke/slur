import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JOIN_TOKEN_MAX_CHARS, joinToken } from './moderation.js';

test( 'joinToken: reads a trimmed string token from the join options', () => {
    assert.equal( joinToken( { token: '  abc  ' } ), 'abc' );
} );

test( 'joinToken: rejects a missing, blank, non-string or oversized token', () => {
    assert.equal( joinToken( undefined ), null );
    assert.equal( joinToken( { name: 'Ann' } ), null );
    assert.equal( joinToken( { token: '   ' } ), null );
    assert.equal( joinToken( { token: 42 } ), null );
    assert.equal( joinToken( { token: 'x'.repeat( JOIN_TOKEN_MAX_CHARS + 1 ) } ), null );
} );
