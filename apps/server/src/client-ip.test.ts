import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientIp, UNKNOWN_IP } from './client-ip.js';

test( 'client ip: a single hop is the client', () => {
    assert.equal( clientIp( { ip: '203.0.113.7' } ), '203.0.113.7' );
} );

test( 'client ip: the last hop wins, so a client-sent X-Forwarded-For cannot pick its own key', () => {
    assert.equal( clientIp( { ip: '1.2.3.4, 203.0.113.7' } ), '203.0.113.7' );
    assert.equal( clientIp( { ip: 'spoof,  , 203.0.113.7 ' } ), '203.0.113.7' );
} );

test( 'client ip: a repeated header uses its last line', () => {
    assert.equal( clientIp( { ip: [ '1.2.3.4', '9.9.9.9, 203.0.113.7' ] } ), '203.0.113.7' );
} );

test( 'client ip: no proxy header falls back to one shared key', () => {
    assert.equal( clientIp( undefined ), UNKNOWN_IP );
    assert.equal( clientIp( { ip: '' } ), UNKNOWN_IP );
    assert.equal( clientIp( { ip: [] } ), UNKNOWN_IP );
    assert.equal( clientIp( { ip: null as unknown as string } ), UNKNOWN_IP );
} );
