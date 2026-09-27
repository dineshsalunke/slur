import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CELL, DEFAULT_TUNING, FIXED_DT, type FlightTuning, STRAFE_PRESS } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { emptyInput } from './input.js';
import { applyStrafe } from './step.js';
import { type SimShip, spawnShip } from './types.js';

const freighter = SHIP_CLASSES.freighter.tuning;
const TAIL = 180;

function strafeOnce( t: FlightTuning, strafe: number, vx = 0 ): number {
    const s = spawnShip( 0, 0 );
    s.vx = vx;
    applyStrafe( s, { ...emptyInput(), strafe }, t, FIXED_DT );
    return s.vx;
}

function fly( t: FlightTuning, strafes: number[], s: SimShip = spawnShip( 0, 0 ) ): SimShip {
    const input = emptyInput();
    for ( const strafe of strafes ) {
        input.strafe = strafe;
        applyStrafe( s, input, t, FIXED_DT );
        s.x += s.vx * FIXED_DT;
    }
    return s;
}

function presses( ...runs: [ number, number ][] ): number[] {
    return runs.flatMap( ( [ strafe, ticks ] ) => new Array< number >( ticks ).fill( strafe ) );
}

function tapTravel( t: FlightTuning, heldTicks: number ): number {
    return fly( t, presses( [ 1, heldTicks ], [ 0, TAIL ] ) ).x;
}

function windowTicks( t: FlightTuning ): number {
    return Math.floor( t.kickDistance / ( t.strafeKick * FIXED_DT ) );
}

test( 'every tap inside the window moves one kick distance for every class', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        assert.equal( c.tuning.kickDistance, CELL, c.id );
        for ( let n = 1; n <= windowTicks( c.tuning ); n++ ) {
            const x = tapTravel( c.tuning, n );
            assert.ok( Math.abs( x - CELL ) <= 0.1, `${ c.id } ${ n } ticks → ${ x.toFixed( 3 ) }u` );
        }
    }
} );

test( 'a released kick stops dead once the distance is covered', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const s = fly( c.tuning, presses( [ 1, 1 ], [ 0, TAIL ] ) );
        assert.equal( s.vx, 0, c.id );
        assert.equal( s.kickLeft, 0, c.id );
    }
} );

test( 'two taps move two kick distances', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const x = fly( c.tuning, presses( [ 1, 2 ], [ 0, 2 ], [ 1, 2 ], [ 0, TAIL ] ) ).x;
        assert.ok( Math.abs( x - 2 * CELL ) <= 0.1, `${ c.id } ${ x.toFixed( 3 ) }u` );
    }
} );

test( 'a press the other way cancels the kick and starts a new one', () => {
    const s = fly( freighter, presses( [ 1, 2 ] ) );
    const at = s.x;
    fly( freighter, presses( [ -1, 2 ], [ 0, TAIL ] ), s );
    assert.ok( Math.abs( s.x - ( at - CELL ) ) <= 0.1, `${ s.x.toFixed( 3 ) }u` );
} );

test( 'a held press leaves the window at the kick speed and ramps as before', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const t = c.tuning;
        const s = fly( t, presses( [ 1, windowTicks( t ) + 1 ] ) );
        assert.equal( s.kickLeft, 0, c.id );
        assert.equal( s.vx, t.strafeKick, c.id );
        const today = spawnShip( 0, 0 );
        today.vx = t.strafeKick;
        const legacy = { ...t, kickDistance: 0 };
        for ( let n = 0; n < 60; n++ ) {
            fly( t, [ 1 ], s );
            fly( legacy, [ 1 ], today );
            assert.equal( s.vx, today.vx, `${ c.id } tick ${ n }` );
        }
        assert.equal( s.vx, t.strafeClamp, c.id );
    }
} );

test( 'a press already faster than the kick speed ramps without a kick', () => {
    const vx = freighter.strafeKick + 10;
    assert.equal( strafeOnce( freighter, 1, vx ), vx + freighter.strafeAccel * FIXED_DT );
} );

test( 'a press from rest or against the drift jumps to the kick speed', () => {
    assert.equal( strafeOnce( freighter, 1 ), freighter.strafeKick );
    assert.equal( strafeOnce( freighter, -1 ), -freighter.strafeKick );
    assert.equal( strafeOnce( freighter, -1, freighter.strafeClamp ), -freighter.strafeKick );
} );

test( 'any press past the threshold is a full kick', () => {
    assert.equal( strafeOnce( freighter, STRAFE_PRESS ), freighter.strafeKick );
    const x = fly( freighter, presses( [ STRAFE_PRESS, 2 ], [ 0, TAIL ] ) ).x;
    assert.ok( Math.abs( x - CELL ) <= 0.1, `${ x.toFixed( 3 ) }u` );
} );

test( 'a light analog press below the threshold keeps the proportional floor', () => {
    const light = STRAFE_PRESS * 0.6;
    const s = spawnShip( 0, 0 );
    applyStrafe( s, { ...emptyInput(), strafe: light }, freighter, FIXED_DT );
    assert.equal( s.vx, freighter.strafeKick * light );
    assert.equal( s.kickLeft, 0 );
} );

test( 'a stun cancels the kick', () => {
    const s = fly( freighter, presses( [ 1, 1 ] ) );
    assert.notEqual( s.kickLeft, 0 );
    s.stunTimer = 0.1;
    s.vx = -9;
    fly( freighter, [ 0 ], s );
    assert.equal( s.kickLeft, 0 );
    assert.equal( s.kicking, false );
    assert.ok( s.vx < 0 );
} );

test( 'a zero kick distance keeps the velocity-floor kick', () => {
    const legacy = { ...freighter, kickDistance: 0 };
    assert.equal( strafeOnce( legacy, 0.5 ), legacy.strafeKick * 0.5 );
    assert.ok( tapTravel( legacy, 6 ) > CELL + 1 );
} );

test( 'a zero kick keeps the plain ramp', () => {
    assert.equal( DEFAULT_TUNING.strafeKick, 0 );
    assert.equal( strafeOnce( DEFAULT_TUNING, 1 ), DEFAULT_TUNING.strafeAccel * FIXED_DT );
    const drift = DEFAULT_TUNING.strafeClamp;
    assert.equal( strafeOnce( DEFAULT_TUNING, -1, drift ), drift - DEFAULT_TUNING.strafeAccel * FIXED_DT );
} );

test( 'a held key still tops out at the clamp', () => {
    const s = fly( freighter, presses( [ 1, 120 ] ) );
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
