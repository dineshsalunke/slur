import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeldPower, HIT_MESSAGE, STUN_SECONDS } from '../combat/constants.js';
import { COUNTDOWN_SECONDS, FIXED_DT, RACE_GRACE_SECONDS, STALL_SECONDS } from '../constants.js';
import { PHASE, type RunMetadata } from '../race/director.js';
import { AUTHORED_LEVEL_VERSION, registerAuthoredLevel } from '../sim/authored/authored-level.js';
import { procgenDescriptor } from '../sim/track-provider.js';
import { RunSim } from './run-sim.js';

function harness() {
    const sent: { type: string; message: unknown }[] = [];
    const metas: RunMetadata[] = [];
    const sim = new RunSim( procgenDescriptor( 1 ), {
        broadcast: ( type, message ) => sent.push( { type, message } ),
        onMeta: ( meta ) => metas.push( meta ),
    } );
    return { sim, sent, metas };
}

function tick( sim: RunSim, seconds: number ): void {
    for ( let i = Math.round( seconds / FIXED_DT ); i > 0; i-- ) sim.fixedStep( FIXED_DT );
}

test( 'only the host starts the run, and the countdown hands over to racing', () => {
    const { sim, metas } = harness();
    sim.join( 'a', 'Host' );
    sim.join( 'b', 'Guest' );
    sim.start( 'b' );
    assert.equal( sim.state.phase, PHASE.lobby, 'a guest cannot start' );
    sim.start( 'a' );
    assert.equal( sim.state.phase, PHASE.countdown );
    tick( sim, COUNTDOWN_SECONDS + FIXED_DT );
    assert.equal( sim.state.phase, PHASE.racing );
    assert.deepEqual( metas.at( -1 ), { hostName: 'Host', phase: PHASE.racing } );
} );

test( 'join names a racer from a string only, trimmed and capped (#339)', () => {
    const { sim } = harness();
    sim.join( 'a', 42 );
    sim.join( 'b', { toString: 'x' } );
    sim.join( 'c', '   ' );
    sim.join( 'd', '  Ann the very long call sign  ' );
    assert.equal( sim.state.players.get( 'a' )?.name, 'Racer' );
    assert.equal( sim.state.players.get( 'b' )?.name, 'Racer' );
    assert.equal( sim.state.players.get( 'c' )?.name, 'Racer' );
    assert.equal( sim.state.players.get( 'd' )?.name, 'Ann the very lon' );
} );

test( 'a zero countdown starts the run straight into racing', () => {
    const sim = new RunSim(
        procgenDescriptor( 1 ),
        { broadcast: () => {}, onMeta: () => {} },
        { countdownSeconds: 0 },
    );
    sim.join( 'a' );
    sim.start( 'a' );
    assert.equal( sim.state.phase, PHASE.racing );
    assert.equal( sim.state.countdown, 0 );
} );

test( 'a bolt stuns the ship it hits and broadcasts one hit', () => {
    const { sim, sent } = harness();
    sim.join( 'a' );
    sim.join( 'b' );
    sim.start( 'a' );
    tick( sim, COUNTDOWN_SECONDS + FIXED_DT );
    const shooter = sim.state.players.get( 'a' );
    const victim = sim.state.players.get( 'b' );
    assert.ok( shooter && victim );
    victim.shipId = 'executioner';
    shooter.x = 0;
    shooter.z = 0;
    victim.x = 0;
    victim.z = 20;
    shooter.slots[ 0 ] = HeldPower.bolt;

    sim.usePower( 'a', { slot: 0 } );
    assert.equal( sim.state.projectiles.size, 1 );
    tick( sim, 0.25 );

    assert.equal( victim.stunTimer, Math.fround( STUN_SECONDS ) );
    assert.equal( sent.filter( ( s ) => s.type === HIT_MESSAGE ).length, 1 );
} );

test( 'a leaving host hands the room to the next connected racer', () => {
    const { sim } = harness();
    sim.join( 'a' );
    sim.join( 'b' );
    sim.leave( 'a' );
    assert.equal( sim.state.hostId, 'b' );
    assert.equal( sim.queues.has( 'a' ), false );
} );

test( 'spawnAt places a fresh racer at a clear start point', () => {
    registerAuthoredLevel( {
        version: AUTHORED_LEVEL_VERSION,
        id: 'spawn-at',
        name: 'spawn-at',
        length: 20,
        source: null,
        savedAt: '',
        blocks: [],
        gaps: [],
    } );
    const sim = new RunSim(
        { kind: 'authored', levelId: 'spawn-at' },
        { broadcast: () => {}, onMeta: () => {} },
        { countdownSeconds: 0 },
    );
    sim.join( 'a' );
    sim.start( 'a' );
    tick( sim, 1 );
    sim.spawnAt( 'a', 4, 200 );
    const p = sim.state.players.get( 'a' );
    assert.ok( p );
    assert.deepEqual( [ p.x, p.z, p.vz, p.lastSafeX, p.lastSafeZ ], [ 4, 200, 0, 4, 200 ] );
} );

test( 'onTick fires once per fixed step that advance runs', () => {
    let ticks = 0;
    const sim = new RunSim( procgenDescriptor( 1 ), {
        broadcast: () => {},
        onMeta: () => {},
        onTick: () => ticks++,
    } );
    sim.advance( FIXED_DT * 3.5 );
    assert.equal( ticks, 3 );
} );

function racing( raceLimits?: boolean ): RunSim {
    const sim = new RunSim(
        procgenDescriptor( 1 ),
        { broadcast: () => {}, onMeta: () => {} },
        { countdownSeconds: 0, raceLimits },
    );
    sim.join( 'a' );
    sim.start( 'a' );
    return sim;
}

function creep( sim: RunSim, id: string, seconds: number ): void {
    const p = sim.state.players.get( id );
    assert.ok( p );
    for ( let i = Math.round( seconds / FIXED_DT ); i > 0 && sim.state.phase === PHASE.racing; i-- ) {
        p.z += 0.01;
        sim.fixedStep( FIXED_DT );
    }
}

test( 'the race cap is synced from the track and zero without race limits (#341)', () => {
    assert.ok( racing().state.raceCap > 0 );
    assert.equal( racing( false ).state.raceCap, 0 );
} );

test( 'an idle solo racer ends the race at the stall limit (#341)', () => {
    const sim = racing();
    tick( sim, STALL_SECONDS - 1 );
    assert.equal( sim.state.phase, PHASE.racing );
    tick( sim, 1 + FIXED_DT * 2 );
    assert.equal( sim.state.phase, PHASE.finished );
} );

test( 'forward progress keeps a racer out of the stall (#341)', () => {
    const sim = racing();
    creep( sim, 'a', STALL_SECONDS + 5 );
    assert.equal( sim.state.phase, PHASE.racing );
} );

test( 'one finisher plus one stalled racer ends the race at once (#341)', () => {
    const sim = racing();
    sim.join( 'b' );
    const b = sim.state.players.get( 'b' );
    assert.ok( b );
    b.spectating = false;
    const a = sim.state.players.get( 'a' );
    assert.ok( a );
    a.finished = true;
    tick( sim, STALL_SECONDS + FIXED_DT * 2 );
    assert.equal( sim.state.phase, PHASE.finished );
    assert.ok( sim.state.elapsed < RACE_GRACE_SECONDS );
} );

test( 'the race cap ends a race that is still creeping forward (#341)', () => {
    const sim = racing();
    const cap = sim.state.raceCap;
    creep( sim, 'a', cap - 1 );
    assert.equal( sim.state.phase, PHASE.racing );
    creep( sim, 'a', 2 );
    assert.equal( sim.state.phase, PHASE.finished );
} );

test( 'without race limits an idle racer races on (#341)', () => {
    const sim = racing( false );
    tick( sim, STALL_SECONDS * 3 );
    assert.equal( sim.state.phase, PHASE.racing );
} );

test( 'spawnAt restarts the stall clock (#341)', () => {
    const sim = racing();
    tick( sim, STALL_SECONDS - 1 );
    sim.spawnAt( 'a', 0, 40 );
    tick( sim, 5 );
    assert.equal( sim.state.phase, PHASE.racing );
} );

test( 'only the host ends the race, and only in countdown or racing (#341)', () => {
    const { sim, metas } = harness();
    sim.join( 'a', 'Host' );
    sim.join( 'b' );
    sim.endRace( 'a' );
    assert.equal( sim.state.phase, PHASE.lobby, 'no end from the lobby' );
    sim.start( 'a' );
    sim.endRace( 'b' );
    assert.equal( sim.state.phase, PHASE.countdown, 'a guest cannot end' );
    sim.endRace( 'a' );
    assert.equal( sim.state.phase, PHASE.finished );
    assert.equal( metas.at( -1 )?.phase, PHASE.finished );
    sim.restart( 'a' );
    sim.start( 'a' );
    tick( sim, COUNTDOWN_SECONDS + FIXED_DT );
    sim.endRace( 'a' );
    assert.equal( sim.state.phase, PHASE.finished );
} );
