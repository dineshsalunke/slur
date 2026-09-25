import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CELL, DEFAULT_TUNING, FIXED_DT, type FlightTuning } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { emptyInput } from './input.js';
import { applyStrafe } from './step.js';
import { spawnShip } from './types.js';

const freighter = SHIP_CLASSES.freighter.tuning;

function strafeOnce( t: FlightTuning, strafe: number, vx = 0 ): number {
    const s = spawnShip( 0, 0 );
    s.vx = vx;
    applyStrafe( s, { ...emptyInput(), strafe }, t, FIXED_DT );
    return s.vx;
}

function tapTravel( t: FlightTuning, heldTicks: number ): number {
    const s = spawnShip( 0, 0 );
    const input = emptyInput();
    for ( let n = 0; n < heldTicks + 180; n++ ) {
        input.strafe = n < heldTicks ? 1 : 0;
        applyStrafe( s, input, t, FIXED_DT );
        s.x += s.vx * FIXED_DT;
    }
    return s.x;
}

test( 'a press from rest jumps straight to the kick speed', () => {
    assert.equal( strafeOnce( freighter, 1 ), freighter.strafeKick );
    assert.equal( strafeOnce( freighter, -1 ), -freighter.strafeKick );
} );

test( 'a press against the current drift reverses at once', () => {
    assert.equal( strafeOnce( freighter, -1, freighter.strafeClamp ), -freighter.strafeKick );
} );

test( 'an analog press kicks in proportion to the deflection', () => {
    assert.equal( strafeOnce( freighter, 0.5 ), freighter.strafeKick * 0.5 );
} );

test( 'above the kick speed the press ramps as before', () => {
    const vx = freighter.strafeKick + 10;
    assert.equal( strafeOnce( freighter, 1, vx ), vx + freighter.strafeAccel * FIXED_DT );
} );

test( 'a zero kick keeps the plain ramp', () => {
    assert.equal( DEFAULT_TUNING.strafeKick, 0 );
    assert.equal( strafeOnce( DEFAULT_TUNING, 1 ), DEFAULT_TUNING.strafeAccel * FIXED_DT );
    const drift = DEFAULT_TUNING.strafeClamp;
    assert.equal( strafeOnce( DEFAULT_TUNING, -1, drift ), drift - DEFAULT_TUNING.strafeAccel * FIXED_DT );
} );

test( 'a held key still tops out at the clamp', () => {
    const s = spawnShip( 0, 0 );
    const input = { ...emptyInput(), strafe: 1 };
    for ( let n = 0; n < 120; n++ ) applyStrafe( s, input, freighter, FIXED_DT );
    assert.equal( s.vx, freighter.strafeClamp );
} );

test( 'every class moves at least one cell on a 100 ms tap', () => {
    for ( const c of Object.values( SHIP_CLASSES ) )
        assert.ok( tapTravel( c.tuning, 6 ) >= CELL, `${ c.id } ${ tapTravel( c.tuning, 6 ).toFixed( 2 ) }u` );
} );

test( 'the interceptor has the hardest kick', () => {
    const kicks = Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.strafeKick );
    assert.equal( SHIP_CLASSES.interceptor.tuning.strafeKick, Math.max( ...kicks ) );
} );
