import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeldPower, HIT_MESSAGE, STUN_SECONDS } from '../combat/constants.js';
import { COUNTDOWN_SECONDS, FIXED_DT } from '../constants.js';
import { PHASE, type RunMetadata } from '../race/director.js';
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
