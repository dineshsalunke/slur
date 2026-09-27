import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CELL, type FlightTuning, TRACK_CONTRACT, WEAVE_MIN_THREAD_FRACTION } from '../../constants.js';
import { SHIP_CLASSES } from '../../ship-classes.js';
import { fly, type Steer } from '../avoid-pilot.test.js';
import { openRunsAtSlice } from '../clearance.js';
import { segmentOf } from '../groove/groove-track.js';
import { segmentsTrack } from '../score/emit.js';
import { CONTRACT_TUNING } from '../score/note-move.js';
import { HALF_WIDTH, SEG_LEN, type Track } from '../space.js';
import { buildPhrase } from './phrase-track.js';
import { ACT_SPEED } from './pitch.js';
import type { Phrase } from './plan.js';
import {
    emitWeave,
    WEAVE_BAND,
    WEAVE_SLALOM_GAP,
    type WeaveBand,
    type WeaveSpec,
    weaveBandsAt,
    weaveLanes,
    weavePitch,
    weaveRunUp,
} from './weave-emit.js';

const SEEDS = Array.from( { length: 30 }, ( _, k ) => k + 1 );
const LEAD = 0.25;
const PROBE_Z0 = 30 * SEG_LEN;
const PROBE_LEN = 480;

export const CONTRACT_SHIP: FlightTuning = {
    ...CONTRACT_TUNING,
    halfW: TRACK_CONTRACT.shipHalfW,
    halfL: TRACK_CONTRACT.shipHalfL,
    maxCruise: TRACK_CONTRACT.pacingCruise * WEAVE_MIN_THREAD_FRACTION,
};

type WeaveRange = Pick< Phrase, 'z0' | 'z1' > & { weave: WeaveSpec };

const centre = ( b: WeaveBand ) => ( b.lo + b.hi ) / 2;

function nearestLane( lanes: readonly WeaveBand[], x: number ): number {
    let k = 0;
    lanes.forEach( ( b, j ) => {
        if ( Math.abs( x - centre( b ) ) < Math.abs( x - centre( lanes[ k ] ) ) ) k = j;
    } );
    return k;
}

export function weaveTarget(
    weaves: readonly WeaveRange[],
    x: number,
    z: number,
    vz: number,
    halfL: number,
): number | null {
    const w = weaves.find( ( p ) => z + halfL >= p.z0 - weaveRunUp( p.weave ) && z - halfL < p.z1 );
    if ( w === undefined ) return null;
    const at = ( zz: number ) => weaveBandsAt( w.weave, w.z0, w.z1, Math.max( w.z0, Math.min( w.z1 - 1, zz ) ) );
    const lanes = weaveLanes( w.weave );
    const k = nearestLane( lanes, x );
    if ( z + halfL < w.z0 ) return centre( lanes[ k ] );
    let lo = Number.NEGATIVE_INFINITY;
    let hi = Number.POSITIVE_INFINITY;
    for ( let zz = z - halfL; zz <= z + halfL + Math.max( vz * LEAD, weavePitch( w.weave, k ) ); zz += CELL / 2 ) {
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

function edgeStart( range: WeaveRange, t: FlightTuning, from: number ): Steer {
    const steer = bandLine( range, t );
    const turn = range.z0 - weaveRunUp( range.weave );
    return ( tick, s ) => ( s.z + t.halfL < turn ? { target: from, jump: false, brake: false } : steer( tick, s ) );
}

const SHAPES: Omit< WeaveSpec, 'salt' >[] = [
    { act: 'low', bands: [ WEAVE_BAND.low ], divider: null, gap: 0 },
    { act: 'mid', bands: [ WEAVE_BAND.mid ], divider: null, gap: 0 },
    { act: 'high', bands: [ WEAVE_BAND.high ], divider: null, gap: 0 },
    { act: 'mid', bands: [ 20, 16 ], divider: 'hole', gap: 4 },
    { act: 'mid', bands: [ 16, 20 ], divider: 'wall', gap: 8 },
    { act: 'high', bands: [ 16, 14 ], divider: 'hole', gap: 8 },
    { act: 'high', bands: [ 14, 16 ], divider: 'wall', gap: 4 },
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

test( 'every lane is straight at its full width from the first row, and its slalom leaves the gap open', () => {
    for ( const shape of SHAPES ) {
        for ( const salt of [ 1, 2, 3 ] ) {
            const spec = { ...shape, salt };
            const track = probeTrack( spec );
            const lanes = weaveLanes( spec );
            for ( let z = PROBE_Z0 + 0.5; z < PROBE_Z0 + PROBE_LEN; z += 1 ) {
                const runs = openRunsAtSlice( track.segmentAtZ( z ), z );
                const bands = weaveBandsAt( spec, PROBE_Z0, PROBE_Z0 + PROBE_LEN, z );
                bands.forEach( ( b, k ) => {
                    const at = `${ JSON.stringify( spec ) } z ${ z } band ${ k }`;
                    assert.ok(
                        runs.some( ( [ lo, hi ] ) => lo <= b.lo + 1e-6 && b.hi <= hi + 1e-6 ),
                        at,
                    );
                    assert.equal( lanes[ k ].hi - lanes[ k ].lo, spec.bands[ k ], at );
                    assert.ok( b.hi - b.lo >= WEAVE_SLALOM_GAP, at );
                    assert.ok(
                        ! runs.some( ( [ lo, hi ] ) => lo < lanes[ k ].lo - 1e-6 && lanes[ k ].lo < hi ),
                        `${ at }: open deck outside the lane`,
                    );
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
                const entry = weaveLanes( spec )[ k ];
                const steer = bandLine( range, CONTRACT_SHIP );
                const pick: Steer = ( tick, s ) =>
                    s.z < range.z0 ? { target: centre( entry ), jump: false, brake: false } : steer( tick, s );
                const f = fly( track, CONTRACT_SHIP, pick );
                assert.ok(
                    f.finished && f.deaths === 0 && f.bumps === 0,
                    `${ JSON.stringify( spec ) } band ${ k }: ${ JSON.stringify( f ) }`,
                );
            }
        }
    }
} );

test( 'every class lines up from either deck edge or the centre within the run-up: no bump, no death', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        for ( const shape of SHAPES ) {
            const t = { ...c.tuning, maxCruise: ACT_SPEED[ shape.act ] * c.tuning.maxCruise };
            const edge = HALF_WIDTH - t.halfW;
            for ( const salt of [ 1, 2, 3 ] ) {
                const spec = { ...shape, salt };
                const track = probeTrack( spec );
                const range = { z0: PROBE_Z0, z1: PROBE_Z0 + PROBE_LEN, weave: spec };
                for ( const from of [ -edge, 0, edge ] ) {
                    const f = fly( track, t, edgeStart( range, t, from ) );
                    assert.ok(
                        f.finished && f.deaths === 0 && f.bumps === 0,
                        `${ c.id } ${ JSON.stringify( spec ) } from ${ from }: ${ JSON.stringify( f ) }`,
                    );
                }
            }
        }
    }
} );

test( 'every phrase weave face has its physics run-up of open deck before it', () => {
    for ( const seed of SEEDS ) {
        const { plan, obstacles } = buildPhrase( seed );
        plan.phrases.forEach( ( p, k ) => {
            if ( p.weave === null ) return;
            const run = weaveRunUp( p.weave );
            const before = plan.phrases[ k - 1 ];
            const at = `seed ${ seed }: weave at ${ p.z0 } run-up ${ run }`;
            assert.equal( before?.kind, 'arena', at );
            assert.ok( p.z0 - before.z0 >= run, at );
            assert.ok( ! obstacles.some( ( o ) => o.z0 < p.z0 && o.z1 > p.z0 - run ), at );
        } );
    }
} );
