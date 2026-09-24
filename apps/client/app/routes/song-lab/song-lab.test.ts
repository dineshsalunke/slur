import { composeScore, emptyInput, FIXED_DT, SHIP_CLASSES, SHIPS, type ShipClassId } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    type LabBundle,
    type LabHumanRun,
    type LabRun,
    type LabSkill,
    type LabVariant,
    labDigest,
    labResult,
    labTrack,
    packInputs,
    replayRun,
} from '../../../song-lab/bundle';
import { checkVariant } from './lab-check';
import { formatResult, labEntries, labHref, pickEntry, pickVariant, shipForClass } from './lab-view';
import { crossingTick } from './replay-state';
import { shipTimeAt, songTarget, songTimeAt } from './song-sync';

const score = composeScore( 11, 12 );

function variant( id: string, runs: LabRun[], humanRuns?: LabHumanRun[] ): LabVariant {
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
        humanRuns,
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

function human( classId: ShipClassId, skill: LabSkill, ticks: number ): LabHumanRun {
    return {
        ...recorded( classId, ticks ),
        pilot: { skill, seed: 1, reactTicks: 9, aimSigma: 0.4, takeoffJitter: 6 },
    };
}

describe( 'song-lab check', () => {
    it( 'matches perfect and human runs against their own recordings', () => {
        const v = variant(
            'a',
            [ recorded( 'fighter', 600 ), recorded( 'freighter', 600 ) ],
            [ human( 'fighter', 'rookie', 400 ) ],
        );
        const c = checkVariant( v );
        expect( c.digestOk ).toBe( true );
        expect( c.matches ).toEqual( {
            'fighter/perfect': true,
            'fighter/rookie': true,
            'freighter/perfect': true,
        } );
    } );

    it( 'flags a tampered result and a tampered digest', () => {
        const run = recorded( 'comet', 300 );
        const v = variant( 'a', [ { ...run, result: { ...run.result, ticks: run.result.ticks + 1 } } ] );
        const c = checkVariant( { ...v, trackDigest: v.trackDigest + 1 } );
        expect( c.digestOk ).toBe( false );
        expect( c.matches[ 'comet/perfect' ] ).toBe( false );
    } );
} );

describe( 'song-lab picks', () => {
    const withHumans = variant(
        'a',
        [ recorded( 'comet', 1 ), recorded( 'fighter', 1 ) ],
        [ human( 'fighter', 'club', 1 ), human( 'comet', 'rookie', 1 ), human( 'comet', 'pro', 1 ) ],
    );
    const song = {
        file: 's',
        duration: 0,
        bpm: 120,
        beatsPerBar: 4,
        sections: [],
        clock: { z0: 257.3, t0: 0, zPerSecond: 124 },
    };
    const bundle: LabBundle = {
        version: 1,
        createdAt: '',
        song,
        variants: [ withHumans, variant( 'b', [] ) ],
    };

    it( 'orders entries by bundle class order, then perfect, pro, club, rookie', () => {
        expect( labEntries( withHumans ).map( ( e ) => e.key ) ).toEqual( [
            'comet/perfect',
            'comet/pro',
            'comet/rookie',
            'fighter/perfect',
            'fighter/club',
        ] );
    } );

    it( 'treats a bundle without humanRuns as perfect runs only', () => {
        expect( labEntries( variant( 'c', [ recorded( 'comet', 1 ) ] ) ).map( ( e ) => e.key ) ).toEqual( [
            'comet/perfect',
        ] );
    } );

    it( 'falls back to the first variant, then perfect, then the first flown class', () => {
        const entries = labEntries( withHumans );
        expect( pickVariant( bundle, 'nope' ).id ).toBe( 'a' );
        expect( pickEntry( entries, 'fighter', 'club' )?.key ).toBe( 'fighter/club' );
        expect( pickEntry( entries, 'fighter', 'rookie' )?.key ).toBe( 'fighter/perfect' );
        expect( pickEntry( entries, 'interceptor', null )?.key ).toBe( 'comet/perfect' );
        expect( pickEntry( [], null, null ) ).toBeUndefined();
    } );

    it( 'maps every class to the ship that carries it', () => {
        for ( const classId of Object.keys( SHIP_CLASSES ) as ShipClassId[] )
            expect( SHIPS[ shipForClass( classId ) ].classId ).toBe( classId );
    } );

    it( 'builds a query string for a pick', () => {
        expect( labHref( { bundle: 'x.json', variant: 'a', classId: 'comet', pilot: 'rookie' } ) ).toBe(
            '?bundle=x.json&variant=a&class=comet&pilot=rookie',
        );
    } );

    it( 'formats a result with its death positions', () => {
        const r = { ...recorded( 'comet', 1 ).result, deaths: 2, deathZ: [ 10.4, 99.6 ], time: 3 };
        expect( formatResult( r ) ).toBe( 'DNF · 3.00 s · 2 deaths @ z 10, 100 · 0 bumps' );
    } );

    it( 'finds the fractional tick where the ship crosses the song start', () => {
        expect( crossingTick( 10, 250, 254, 257.3 ) ).toBeNull();
        expect( crossingTick( 11, 255, 259, 257.3 ) ).toBeCloseTo( 10 + 2.3 / 4 );
        expect( crossingTick( 1, 300, 300, 257.3 ) ).toBe( 0 );
    } );

    it( 'starts song time at the crossing and plays only while running inside the song', () => {
        const map = { z0: 257.3, t0: 0, zPerSecond: 124 };
        expect( songTimeAt( map, null, 300, 0 ) ).toBeNull();
        expect( songTimeAt( map, 248.5, 308, 0.5 ) ).toBeCloseTo( 60 * FIXED_DT );
        expect( shipTimeAt( map, 257.3 + 124 ) ).toBeCloseTo( 1 );
        expect( songTarget( 1, 200, true ) ).toBe( 1 );
        expect( songTarget( 1, 200, false ) ).toBeNull();
        expect( songTarget( null, 200, true ) ).toBeNull();
        expect( songTarget( 201, 200, true ) ).toBeNull();
    } );
} );
