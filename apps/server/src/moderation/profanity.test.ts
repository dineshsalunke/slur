import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SHIP_CLASSES, SHIPS } from '@slur/shared';
import { cleanChat, cleanName, GAME_WORDS, maskProfanity, NAME_FALLBACK } from './profanity.js';

const gameNames = [
    ...GAME_WORDS,
    ...Object.values( SHIPS ).map( ( s ) => s.name ),
    ...Object.values( SHIP_CLASSES ).map( ( c ) => c.name ),
    'Racer',
    'Scunthorpe',
    'assassin',
    'analysis',
    'class',
    'pass',
    'go go go',
];

test( 'profanity: game words, ship names and Scunthorpe-style words pass', () => {
    for ( const word of gameNames ) {
        assert.equal( maskProfanity( word ), word, word );
        assert.equal( cleanName( word ), word, word );
    }
    assert.equal( maskProfanity( 'SLUR is a racer' ), 'SLUR is a racer' );
} );

test( 'profanity: plain, leet and stretched words are masked in chat', () => {
    assert.equal( cleanChat( 'you bitch' ), 'you *****' );
    assert.equal( cleanChat( 'sh1t' ), '****' );
    assert.equal( cleanChat( 'fuuuuck' ), '****' );
    assert.equal( cleanChat( 'nice cockpit' ), 'nice cockpit' );
} );

test( 'profanity: zero-width characters cannot split a word', () => {
    assert.equal( cleanChat( 'bi​tch' ), '*****' );
    assert.equal( cleanName( 'bi​tch' ), NAME_FALLBACK );
} );

test( 'cleanName: a profane name falls back, a clean one is tidied', () => {
    assert.equal( cleanName( 'Big Bitch' ), NAME_FALLBACK );
    assert.equal( cleanName( '  Ann\u0000‍   Lee ' ), 'Ann Lee' );
    assert.equal( cleanName( 7 ), NAME_FALLBACK );
} );
