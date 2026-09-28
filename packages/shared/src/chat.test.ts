import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAT_MAX_CHARS, cleanChatText } from './chat.js';

test( 'chat text: a non-string becomes empty', () => {
    assert.equal( cleanChatText( undefined ), '' );
    assert.equal( cleanChatText( 42 ), '' );
    assert.equal( cleanChatText( { text: 'hi' } ), '' );
} );

test( 'chat text: whitespace, newlines and control characters collapse to one space', () => {
    assert.equal( cleanChatText( '  gg\n\nwp\t\u0007 all  ' ), 'gg wp all' );
    assert.equal( cleanChatText( ' \n\t ' ), '' );
} );

test( 'chat text: capped at CHAT_MAX_CHARS code points', () => {
    assert.equal( cleanChatText( 'x'.repeat( 500 ) ).length, CHAT_MAX_CHARS );
    const rockets = cleanChatText( '🚀'.repeat( 200 ) );
    assert.equal( [ ...rockets ].length, CHAT_MAX_CHARS, 'a surrogate pair is never split' );
} );
