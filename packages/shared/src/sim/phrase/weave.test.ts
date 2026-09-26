import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CELL, type FlightTuning, TRACK_CONTRACT, WEAVE_MIN_THREAD_FRACTION } from '../../constants.js';
import { fly, type Steer } from '../avoid-pilot.test.js';
import { openRunsAtSlice } from '../clearance.js';
import { segmentOf } from '../groove/groove-track.js';
import { segmentsTrack } from '../score/emit.js';
import { CONTRACT_TUNING } from '../score/note-move.js';
import { SEG_LEN, type Track } from '../space.js';
import { buildPhrase } from './phrase-track.js';
import type { Phrase } from './plan.js';
import {
    emitWeave,
    WEAVE_BAND,
    WEAVE_PITCH,
    WEAVE_SLALOM_GAP,
    type WeaveSpec,
    weaveBandsAt,
    weaveLanesAt,
    weaveOpenness,
} from './weave-emit.js';

const SEEDS = Array.from( { length: 30 }, ( _, k ) => k + 1 );
const LEAD = 0.25;
const PROBE_Z0 = 12 * SEG_LEN;
const PROBE_LEN = 480;

export const CONTRACT_SHIP: FlightTuning = {
    ...CONTRACT_TUNING,
    halfW: TRACK_CONTRACT.shipHalfW,
    halfL: TRACK_CONTRACT.shipHalfL,
    maxCruise: TRACK_CONTRACT.pacingCruise * WEAVE_MIN_THREAD_FRACTION,
};

type WeaveRange = Pick< Phrase, 'z0' | 'z1' > & { weave: WeaveSpec };

export function weaveTarget(
    weaves: readonly WeaveRange[],
    x: number,
    z: number,
    vz: number,
    halfL: number,
): number | null {
    const w = weaves.find( ( p ) => z + halfL >= p.z0 && z - halfL < p.z1 );
    if ( w === undefined ) return null;
    const at = ( zz: number ) => weaveBandsAt( w.weave, w.z0, w.z1, Math.max( w.z0, Math.min( w.z1 - 1, zz ) ) );
    const lanes = weaveLanesAt( w.weave, w.z0, w.z1, Math.max( w.z0, Math.min( w.z1 - 1, z ) ) );
    const centre = ( b: { lo: number; hi: number } ) => ( b.lo + b.hi ) / 2;
    let k = 0;
    lanes.forEach( ( b, j ) => {
        if ( Math.abs( x - centre( b ) ) < Math.abs( x - centre( lanes[ k ] ) ) ) k = j;
    } );
    let lo = Number.NEGATIVE_INFINITY;
    let hi = Number.POSITIVE_INFINITY;
    for (
        let zz = z - halfL;
        zz <= z + halfL + Math.max( vz * LEAD, WEAVE_PITCH[ w.weave.bands[ k ] ] );
        zz += CELL / 2
    ) {
        const b = at( zz )[ k ];
        if ( Math.min( hi, b.hi ) - Math.max( lo, b.lo ) < CELL ) break;
        lo = Math.max( lo, b.lo );
        hi = Math.min( hi, b.hi );
    }
    return Number.isFinite( lo ) ? ( lo + hi ) / 2 : centre( lanes[ k ] );
}

export function phraseWeaves( seed: number ): ( Phrase & { weave: WeaveSpec } )[] {
    return buildPhrase( seed ).plan.phrases.filter( ( p ): p is Phrase & { weave: WeaveSpec } => p.weave !== null );
}

function probeTrack( spec: WeaveSpec ): Track {
    const length = Math.ceil( ( PROBE_Z0 + PROBE_LEN ) / SEG_LEN ) + 8;
    const obstacles = emitWeave( spec, PROBE_Z0, PROBE_Z0 + PROBE_LEN, 0 );
    const segments = Array.from( { length }, ( _, i ) => segmentOf( i, obstacles ) );
    return { ...segmentsTrack( segments, length ), anchors: [] };
}

function bandLine( range: WeaveRange, t: FlightTuning ): Steer {
    return ( _tick, s ) => ( {
        target: weaveTarget( [ range ], s.x, s.z, s.vz, t.halfL ) ?? 0,
        jump: false,
        brake: false,
    } );
}

const SHAPES: Omit< WeaveSpec, 'salt' >[] = [
    { bands: [ WEAVE_BAND.low ], divider: null, gap: 0 },
    { bands: [ WEAVE_BAND.mid ], divider: null, gap: 0 },
    { bands: [ WEAVE_BAND.high ], divider: null, gap: 0 },
    { bands: [ 20, 16 ], divider: 'hole', gap: 4 },
    { bands: [ 16, 20 ], divider: 'wall', gap: 8 },
    { bands: [ 16, 14 ], divider: 'hole', gap: 8 },
    { bands: [ 14, 16 ], divider: 'wall', gap: 4 },
];

function assertWeaveRoll( seed: number, p: Phrase & { weave: WeaveSpec } ): boolean {
    const w = p.weave;
    assert.ok( p.z1 - p.z0 <= 480 && p.z1 - p.z0 >= 240, `seed ${ seed }: weave ${ p.z1 - p.z0 }u` );
    if ( p.act === 'low' ) assert.deepEqual( w.bands, [ 20 ] );
    if ( w.bands.length === 1 ) {
        assert.deepEqual( w.bands, [ WEAVE_BAND[ p.act ] ] );
        return false;
    }
    assert.notEqual( p.act, 'low' );
    assert.deepEqual(
        [ ...w.bands ].sort( ( a, b ) => a - b ),
        p.act === 'mid' ? [ 16, 20 ] : [ 14, 16 ],
    );
    assert.ok( w.gap >= 4 && w.gap <= 8 );
    return true;
}

test( 'act 1 weaves are single 20u bands; later acts roll parallel bands at the RFC widths', () => {
    let parallel = 0;
    let weaves = 0;
    for ( const seed of SEEDS ) {
        for ( const p of phraseWeaves( seed ) ) {
            weaves++;
            if ( assertWeaveRoll( seed, p ) ) parallel++;
        }
    }
    assert.ok( parallel > 0 && parallel < weaves, `${ parallel } of ${ weaves } weaves parallel` );
} );

test( 'every lane is straight at its full width, and its slalom leaves the gap open on every slice', () => {
    for ( const shape of SHAPES ) {
        for ( const salt of [ 1, 2, 3 ] ) {
            const spec = { ...shape, salt };
            const track = probeTrack( spec );
            for ( let z = PROBE_Z0 + 0.5; z < PROBE_Z0 + PROBE_LEN; z += 1 ) {
                const runs = openRunsAtSlice( track.segmentAtZ( z ), z );
                const bands = weaveBandsAt( spec, PROBE_Z0, PROBE_Z0 + PROBE_LEN, z );
                const lanes = weaveLanesAt( spec, PROBE_Z0, PROBE_Z0 + PROBE_LEN, z );
                const full = weaveOpenness( PROBE_Z0, PROBE_Z0 + PROBE_LEN, Math.floor( z / CELL ) * CELL + 2 ) === 1;
                bands.forEach( ( b, k ) => {
                    const at = `${ JSON.stringify( spec ) } z ${ z } band ${ k }`;
                    assert.ok(
                        runs.some( ( [ lo, hi ] ) => lo <= b.lo + 1e-6 && b.hi <= hi + 1e-6 ),
                        at,
                    );
                    if ( full ) {
                        assert.equal( lanes[ k ].hi - lanes[ k ].lo, spec.bands[ k ], at );
                        assert.ok( b.hi - b.lo >= WEAVE_SLALOM_GAP, at );
                    }
                } );
            }
        }
    }
} );

test( 'the contract ship threads every band shape at the contract floor speed with no bump', () => {
    for ( const shape of SHAPES ) {
        for ( const salt of [ 1, 2, 3, 4, 5 ] ) {
            const spec = { ...shape, salt };
            const track = probeTrack( spec );
            for ( let k = 0; k < spec.bands.length; k++ ) {
                const range = { z0: PROBE_Z0, z1: PROBE_Z0 + PROBE_LEN, weave: spec };
                const entry = weaveBandsAt( spec, range.z0, range.z1, range.z0 + 60 )[ k ];
                const steer = bandLine( range, CONTRACT_SHIP );
                const pick: Steer = ( tick, s ) =>
                    s.z < range.z0
                        ? { target: ( entry.lo + entry.hi ) / 2, jump: false, brake: false }
                        : steer( tick, s );
                const f = fly( track, CONTRACT_SHIP, pick );
                assert.ok(
                    f.finished && f.deaths === 0 && f.bumps === 0,
                    `${ JSON.stringify( spec ) } band ${ k }: ${ JSON.stringify( f ) }`,
                );
            }
        }
    }
} );
