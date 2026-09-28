import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAT_HISTORY_LINES } from '@slur/shared';
import { CHAT_BURST, CHAT_WINDOW_MS, ChatLog } from './chat-log.js';

const ann = { id: 'a', name: 'Ann', colorId: 3 };
const bob = { id: 'b', name: 'Bob', colorId: 5 };

test( 'chat log: stamps the sender and cleans the text', () => {
    const log = new ChatLog();
    const line = log.post( ann, '  hello\n room ', 0 );
    assert.deepEqual( line, { id: 1, from: 'a', name: 'Ann', colorId: 3, text: 'hello room' } );
    assert.deepEqual( log.history(), [ line ] );
} );

test( 'chat log: empty text is dropped', () => {
    const log = new ChatLog();
    assert.equal( log.post( ann, '   ', 0 ), null );
    assert.equal( log.post( ann, 7, 0 ), null );
    assert.equal( log.history().length, 0 );
} );

test( 'chat log: a sender gets CHAT_BURST lines per window, then is dropped until the window slides', () => {
    const log = new ChatLog();
    for ( let i = 0; i < CHAT_BURST; i++ ) assert.ok( log.post( ann, `line ${ i }`, i * 10 ) );
    assert.equal( log.post( ann, 'spam', 100 ), null );
    assert.ok( log.post( bob, 'mine still goes', 100 ), 'the limit is per sender' );
    assert.equal( log.post( ann, 'still spam', CHAT_WINDOW_MS - 1 ), null );
    assert.ok( log.post( ann, 'back', CHAT_WINDOW_MS ), 'the oldest line left the window' );
} );

test( 'chat log: a dropped send does not extend the window', () => {
    const log = new ChatLog();
    for ( let i = 0; i < CHAT_BURST; i++ ) log.post( ann, 'x', 0 );
    for ( let t = 100; t < CHAT_WINDOW_MS; t += 100 ) log.post( ann, 'spam', t );
    assert.ok( log.post( ann, 'ok', CHAT_WINDOW_MS ) );
} );

test( 'chat log: history keeps the last CHAT_HISTORY_LINES lines, oldest first', () => {
    const log = new ChatLog();
    const total = CHAT_HISTORY_LINES + 7;
    for ( let i = 0; i < total; i++ ) log.post( { ...ann, id: `s${ i }` }, `n${ i }`, 0 );
    const history = log.history();
    assert.equal( history.length, CHAT_HISTORY_LINES );
    assert.equal( history[ 0 ]?.text, 'n7' );
    assert.equal( history.at( -1 )?.text, `n${ total - 1 }` );
} );

test( 'chat log: forget clears the sender budget', () => {
    const log = new ChatLog();
    for ( let i = 0; i < CHAT_BURST; i++ ) log.post( ann, 'x', 0 );
    log.forget( 'a' );
    assert.ok( log.post( ann, 'fresh', 1 ) );
} );
