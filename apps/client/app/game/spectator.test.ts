import { beforeEach, describe, expect, it } from 'vitest';
import {
    cycleSpectatorTarget,
    resetSpectatorTarget,
    resolveSpectatorTarget,
    type SpectatorCandidate,
    spectatorCam,
} from './spectator';

function field( ...rows: [ string, number, boolean? ][] ): [ string, SpectatorCandidate ][] {
    return rows.map( ( [ id, z, spectating = false ] ) => [ id, { z, spectating } ] );
}

describe( 'resolveSpectatorTarget', () => {
    beforeEach( resetSpectatorTarget );

    it( 'picks the leader and pins it', () => {
        expect( resolveSpectatorTarget( field( [ 'a', 10 ], [ 'b', 40 ], [ 'c', 20 ] ) ) ).toBe( 'b' );
        expect( spectatorCam.targetSessionId ).toBe( 'b' );
        expect( resolveSpectatorTarget( field( [ 'a', 90 ], [ 'b', 40 ] ) ) ).toBe( 'b' );
    } );

    it( 'skips spectators, even one further down the track', () => {
        expect( resolveSpectatorTarget( field( [ 'watcher', 500, true ], [ 'a', 5 ] ) ) ).toBe( 'a' );
    } );

    it( 'keeps a cycled choice', () => {
        cycleSpectatorTarget( [ 'a', 'b' ], 1 );
        expect( resolveSpectatorTarget( field( [ 'a', 1 ], [ 'b', 99 ] ) ) ).toBe( 'a' );
    } );

    it( 'moves to the leader when the target stops racing', () => {
        resolveSpectatorTarget( field( [ 'a', 50 ], [ 'b', 10 ] ) );
        expect( resolveSpectatorTarget( field( [ 'b', 10 ], [ 'c', 30 ] ) ) ).toBe( 'c' );
    } );

    it( 'is null with no racers, and reset clears the pin', () => {
        expect( resolveSpectatorTarget( field( [ 'watcher', 0, true ] ) ) ).toBeNull();
        resolveSpectatorTarget( field( [ 'a', 1 ] ) );
        resetSpectatorTarget();
        expect( spectatorCam.targetSessionId ).toBeNull();
    } );
} );
