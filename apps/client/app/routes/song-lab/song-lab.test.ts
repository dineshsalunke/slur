import { composeScore, emptyInput, SHIP_CLASSES, SHIPS, type ShipClassId } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    type LabBundle,
    type LabRun,
    type LabVariant,
    labDigest,
    labResult,
    labTrack,
    packInputs,
    replayRun,
} from '../../../song-lab/bundle';
import { checkVariant } from './lab-check';
import { formatResult, labHref, pickClass, pickVariant, shipForClass } from './lab-view';

const score = composeScore( 11, 12 );

function variant( id: string, runs: LabRun[] ): LabVariant {
    return {
        id,
        label: id,
        rules: [],
        build: { kind: 'compose', seed: 11, length: 12, library: 'standard', curve: null },
        motifs: null,
        score,
        scoreString: '',
        phraseStrings: [],
        intensity: [],
        trackDigest: labDigest( { score } ),
        runs,
    };
}

function recorded( classId: ShipClassId, ticks: number ): LabRun {
    const inputs = packInputs(
        Array.from( { length: ticks }, ( _, i ) => ( {
            ...emptyInput( i ),
            throttle: 1,
            strafe: i % 240 < 120 ? 1 : -1,
        } ) ),
    );
    const r = replayRun( labTrack( { score } ), { classId, inputs } );
    return { classId, inputs, result: labResult( r ), trace: r.trace };
}

describe( 'song-lab check', () => {
    it( 'matches a run against its own recording', () => {
        const c = checkVariant( variant( 'a', [ recorded( 'fighter', 600 ), recorded( 'freighter', 600 ) ] ) );
        expect( c.digestOk ).toBe( true );
        expect( c.matches ).toEqual( { fighter: true, freighter: true } );
    } );

    it( 'flags a tampered result and a tampered digest', () => {
        const run = recorded( 'comet', 300 );
        const v = variant( 'a', [ { ...run, result: { ...run.result, ticks: run.result.ticks + 1 } } ] );
        const c = checkVariant( { ...v, trackDigest: v.trackDigest + 1 } );
        expect( c.digestOk ).toBe( false );
        expect( c.matches.comet ).toBe( false );
    } );
} );

describe( 'song-lab picks', () => {
    const bundle: LabBundle = {
        version: 1,
        createdAt: '',
        song: { file: 's', duration: 0, bpm: 120, beatsPerBar: 4, sections: [] },
        variants: [ variant( 'a', [ recorded( 'comet', 1 ) ] ), variant( 'b', [] ) ],
    };

    it( 'falls back to the first variant and the first flown class', () => {
        expect( pickVariant( bundle, 'nope' ).id ).toBe( 'a' );
        expect( pickClass( pickVariant( bundle, null ), 'interceptor' ) ).toBe( 'comet' );
    } );

    it( 'maps every class to the ship that carries it', () => {
        for ( const classId of Object.keys( SHIP_CLASSES ) as ShipClassId[] )
            expect( SHIPS[ shipForClass( classId ) ].classId ).toBe( classId );
    } );

    it( 'builds a query string for a pick', () => {
        expect( labHref( { bundle: 'x.json', variant: 'a', classId: 'comet' } ) ).toBe(
            '?bundle=x.json&variant=a&class=comet',
        );
    } );

    it( 'formats a result with its death positions', () => {
        const r = { ...recorded( 'comet', 1 ).result, deaths: 2, deathZ: [ 10.4, 99.6 ], time: 3 };
        expect( formatResult( r ) ).toBe( 'DNF · 3.00 s · 2 deaths @ z 10, 100' );
    } );
} );
