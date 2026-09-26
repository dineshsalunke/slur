import assert from 'node:assert/strict';
import { test } from 'node:test';
import { absorbHit, raiseShield, type ShieldHolder, stepShield } from './shield.js';

const DT = 1 / 60;

function holder(): ShieldHolder {
    return { shielded: false, shieldTimer: 0 };
}

test( 'an unshielded ship absorbs nothing', () => {
    const s = holder();
    assert.equal( absorbHit( s ), false );
    assert.equal( s.shielded, false );
} );

test( 'a raised shield absorbs exactly one hit', () => {
    const s = holder();
    raiseShield( s, 5 );
    assert.equal( absorbHit( s ), true );
    assert.equal( s.shielded, false );
    assert.equal( s.shieldTimer, 0 );
    assert.equal( absorbHit( s ), false );
} );

test( 'the shield drops when its window ends', () => {
    const s = holder();
    raiseShield( s, 5 );
    for ( let i = 0; i < 5 * 60 - 1; i++ ) stepShield( s, DT );
    assert.equal( s.shielded, true );
    stepShield( s, DT );
    stepShield( s, DT );
    assert.equal( s.shielded, false );
    assert.equal( absorbHit( s ), false );
} );

test( 'raising again restarts the window', () => {
    const s = holder();
    raiseShield( s, 5 );
    for ( let i = 0; i < 4 * 60; i++ ) stepShield( s, DT );
    raiseShield( s, 5 );
    assert.ok( Math.abs( s.shieldTimer - 5 ) < 1e-9 );
} );

test( 'a zero window never raises the shield', () => {
    const s = holder();
    raiseShield( s, 0 );
    assert.equal( s.shielded, false );
} );
