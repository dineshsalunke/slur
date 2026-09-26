import {
    copySimShip,
    createSimWorld,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    froundSimShip,
    type PlayerInput,
    procgenDescriptor,
    resolveTrack,
    SIM_FLOAT_KEYS,
    type SimShip,
    simulate,
    spawnShip,
    tuningForShip,
} from '@slur/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearBlockState } from '../game/block-state';
import { createPredictor } from './prediction';

const track = resolveTrack( procgenDescriptor( 7 ) );

function inputAt( seq: number ): PlayerInput {
    return {
        seq,
        throttle: seq % 50 < 40 ? 1 : 0,
        brake: seq % 50 >= 45 ? 1 : 0,
        strafe: Math.sin( seq / 7 ),
        jump: seq % 30 === 0,
    };
}

function snapshotOf( ship: SimShip, lastProcessedInput: number, shipId: string ) {
    const out = spawnShip();
    copySimShip( out, ship );
    for ( const k of SIM_FLOAT_KEYS ) out[ k ] = new Float32Array( [ ship[ k ] ] )[ 0 ];
    return { ...out, lastProcessedInput, shipId };
}

describe( 'createPredictor', () => {
    beforeEach( clearBlockState );

    it( 'reset drops every pending input, sent or not', () => {
        const predictor = createPredictor();
        for ( let seq = 1; seq <= 3; seq++ ) predictor.record( inputAt( seq ) );
        predictor.drainUnsent();
        for ( let seq = 4; seq <= 6; seq++ ) predictor.record( inputAt( seq ) );
        predictor.reset();
        expect( predictor.drainUnsent() ).toEqual( [] );

        const server = spawnShip();
        const sim = spawnShip();
        const snapshot = snapshotOf( server, 0, 'challenger' );
        predictor.reconcile( sim, snapshot, track );
        const { lastProcessedInput: _ack, shipId: _id, ...ship } = snapshot;
        expect( sim ).toEqual( ship );
    } );

    it( 'a reconcile replay lands bit-exact on a server that rounds each tick', () => {
        const shipId = 'challenger';
        const tuning = tuningForShip( shipId );
        const serverWorld = createSimWorld();
        const server = spawnShip();
        let snapshot = snapshotOf( server, 0, shipId );
        const predictor = createPredictor();
        for ( let seq = 1; seq <= 240; seq++ ) {
            const input = inputAt( seq );
            predictor.record( input );
            simulate( server, input, FIXED_DT, tuning, track, DEFAULT_SIM_CONFIG, serverWorld );
            froundSimShip( server );
            if ( seq === 120 ) snapshot = snapshotOf( server, seq, shipId );
        }
        expect( serverWorld.broken.size ).toBe( 0 );
        predictor.drainUnsent();

        const sim = spawnShip();
        predictor.reconcile( sim, snapshot, track );
        expect( sim ).toEqual( server );
    } );
} );
