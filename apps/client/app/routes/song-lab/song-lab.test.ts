import {
    createSimWorld,
    emptyInput,
    FIXED_DT,
    resolveTrack,
    SHIP_CLASSES,
    spawnShip,
    type Track,
    type TrackDescriptor,
} from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { LabBundle, LabRun } from './lab-bundle';
import { labHref, pickShip, pickVariant } from './lab-view';
import { createReplay, replayLive, replayResult, rewindReplay, sameResult, stepReplay } from './replay-step';

const DESC: TrackDescriptor = {
    kind: 'procgen',
    seed: 7,
    tier: 0,
    length: 20,
    blockDensity: 0,
    gapChance: 0,
};
const track: Track = resolveTrack( DESC );

function throttleInputs( n: number ) {
    return Array.from( { length: n }, ( _, i ) => ( { ...emptyInput( i ), throttle: 1 } ) );
}

function runAll( inputs: ReturnType< typeof throttleInputs > ) {
    const r = createReplay();
    r.inputs = inputs;
    const s = spawnShip();
    const world = createSimWorld();
    while ( replayLive( r ) ) stepReplay( r, s, FIXED_DT, SHIP_CLASSES.fighter.tuning, track, world );
    return { result: replayResult( r ), z: s.z, r };
}

describe( 'song-lab replay', () => {
    it( 'stops on the tick the ship finishes', () => {
        const { result, r } = runAll( throttleInputs( 60 * 60 ) );
        expect( result.finished ).toBe( true );
        expect( result.frames ).toBeLessThan( r.inputs.length );
        expect( r.frame ).toBe( result.frames );
    } );

    it( 'stops at the end of the inputs when the ship does not finish', () => {
        const { result } = runAll( throttleInputs( 30 ) );
        expect( result ).toEqual( { finished: false, frames: 30, deaths: 0 } );
    } );

    it( 'replays the same inputs to the same result and position', () => {
        const a = runAll( throttleInputs( 600 ) );
        const b = runAll( throttleInputs( 600 ) );
        expect( sameResult( a.result, b.result ) ).toBe( true );
        expect( a.z ).toBe( b.z );
    } );

    it( 'rewind resets the tally and bumps the generation', () => {
        const { r } = runAll( throttleInputs( 30 ) );
        const gen = r.generation;
        rewindReplay( r );
        expect( [ r.frame, r.deaths, r.finishFrame, r.generation ] ).toEqual( [ 0, 0, -1, gen + 1 ] );
    } );
} );

describe( 'song-lab picks', () => {
    const run = ( shipId: LabRun[ 'shipId' ] ): LabRun => ( {
        shipId,
        inputs: [],
        result: { finished: false, frames: 0, deaths: 0 },
    } );
    const bundle: LabBundle = {
        name: 'b',
        song: 's',
        variants: [
            { id: 'a', rules: [], score: '', track: DESC, runs: [ run( 'bob' ) ] },
            { id: 'b', rules: [], score: '', track: DESC, runs: [] },
        ],
    };

    it( 'falls back to the first variant and the first flown class', () => {
        expect( pickVariant( bundle, 'nope' ).id ).toBe( 'a' );
        expect( pickShip( pickVariant( bundle, null ), 'executioner' ) ).toBe( 'bob' );
    } );

    it( 'builds a query string for a pick', () => {
        expect( labHref( { bundle: 'x.json', variant: 'a', shipId: 'bob' } ) ).toBe(
            '?bundle=x.json&variant=a&class=bob',
        );
    } );
} );
