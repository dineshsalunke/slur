import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickupPower } from '../../combat/pickups.js';
import { freezeTrack } from '../../pacing/grid.js';
import { rosterPockets } from '../../pacing/pockets.js';
import { SHIP_CLASSES } from '../../ship-classes.js';
import { avoidPilot, cached, fly, type Steer } from '../avoid-pilot.test.js';
import { shadowHazard } from '../fracture-shadow.js';
import { pickupSalt } from '../pickup-place.js';
import type { Track } from '../space.js';
import { procgenDescriptor, resolveTrack } from '../track-provider.js';
import { GROOVE_BANDS, GROOVE_GRAMMAR, jumpChance, switchChance } from './grammar.js';
import { buildGroove, grooveTrack } from './groove-track.js';
import type { GrooveEvent } from './line.js';
import { openSpace, openSpaceFailures } from './open-space.js';

const SEEDS = Array.from( { length: 30 }, ( _, k ) => k + 1 );
const LENGTH = 400;

function linePilot( seed: number ): Steer {
    const { line, obstacles } = buildGroove( seed, LENGTH );
    const holes = new Set( obstacles.filter( ( o ) => o.kind === 'hole' ).map( ( o ) => o.event ) );
    let next = 0;
    let target = 0;
    let wasDead = false;
    return ( _tick, s ) => {
        if ( wasDead && ! s.dead )
            next = Math.max(
                0,
                line.events.findIndex( ( e ) => e.z > s.z ),
            );
        wasDead = s.dead;
        let jump = false;
        const lead = 0.07 * Math.max( s.vz, 1 );
        while ( next < line.events.length && s.z >= line.events[ next ].z - lead ) {
            const e = line.events[ next ];
            if ( e.kind === 'strafe' ) target = e.to;
            else if ( holes.has( next ) ) jump = true;
            next++;
        }
        return { target, jump, brake: false };
    };
}

test( 'a groove seed emits the same geometry every time', () => {
    assert.deepEqual( buildGroove( 7, LENGTH ), buildGroove( 7, LENGTH ) );
    assert.notDeepEqual( buildGroove( 7, LENGTH ).segments, buildGroove( 8, LENGTH ).segments );
} );

test( 'groove resolves through the procgen descriptor', () => {
    const track = resolveTrack( procgenDescriptor( 3, 'groove' ) );
    assert.deepEqual( track.segmentAt( 100 ), grooveTrack( 3 ).segmentAt( 100 ) );
    assert.ok( track.anchors.length > 0 );
} );

test( 'seeds 1–30 meet every open-space target', () => {
    for ( const seed of SEEDS ) {
        const failures = openSpaceFailures( openSpace( grooveTrack( seed, LENGTH ) ) );
        assert.deepEqual( failures, [], `seed ${ seed }` );
    }
} );

function switchTally( events: readonly GrooveEvent[] ): [ number, number ] {
    const dirs = events.filter( ( e ) => e.kind === 'strafe' ).map( ( e ) => Math.sign( e.to - e.from ) );
    const switched = dirs.slice( 1 ).filter( ( d, k ) => d !== dirs[ k ] ).length;
    return [ switched, Math.max( 0, dirs.length - 1 ) ];
}

test( 'the generated moves follow the take grammar', () => {
    let switched = 0;
    let strafes = 0;
    const jumps = { low: [ 0, 0 ], mid: [ 0, 0 ], high: [ 0, 0 ] };
    for ( const seed of SEEDS ) {
        const { events } = buildGroove( seed, LENGTH ).line;
        const [ sw, n ] = switchTally( events );
        switched += sw;
        strafes += n;
        for ( const e of events ) {
            jumps[ e.band ][ 1 ]++;
            if ( e.kind === 'jump' ) jumps[ e.band ][ 0 ]++;
        }
    }
    assert.ok( Math.abs( switched / strafes - switchChance() ) < 0.08, `switch ${ switched / strafes }` );
    for ( const band of GROOVE_BANDS ) {
        const [ j, n ] = jumps[ band ];
        if ( n < 50 ) continue;
        assert.ok( Math.abs( j / n - jumpChance( band ) ) < 0.08, `${ band } jump ${ j / n }` );
    }
    assert.equal( GROOVE_GRAMMAR.dxBin, 4 );
} );

test( 'no roster pocket on groove seeds', () => {
    for ( const seed of SEEDS.slice( 0, 10 ) ) {
        assert.deepEqual( rosterPockets( freezeTrack( grooveTrack( seed, LENGTH ) ) ), [], `seed ${ seed }` );
    }
} );

test( 'every class finishes groove seeds with a late-reacting avoidance pilot and no death', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        for ( const seed of SEEDS.slice( 0, 5 ) ) {
            const track = cached( grooveTrack( seed, LENGTH ) );
            const f = fly( track, c.tuning, avoidPilot( track, c.tuning ) );
            assert.ok( f.finished && f.deaths === 0, `${ c.id } seed ${ seed }: ${ JSON.stringify( f ) }` );
        }
    }
} );

test( 'the freighter flies the groove line itself with no death and no bump, smashing through fractured blocks', () => {
    let smashed = 0;
    let placed = 0;
    for ( const seed of SEEDS ) {
        const smashes = buildGroove( seed, LENGTH ).obstacles.filter( ( o ) => o.kind === 'smash' ).length;
        const f = fly( cached( grooveTrack( seed, LENGTH ) ), SHIP_CLASSES.freighter.tuning, linePilot( seed ) );
        assert.deepEqual(
            { finished: f.finished, deaths: f.deaths, bumps: f.bumps, smashes: 0 },
            { finished: true, deaths: 0, bumps: 0, smashes: 0 },
            `seed ${ seed }: ${ JSON.stringify( f ) }`,
        );
        assert.ok( f.smashes >= 1 && f.smashes <= smashes, `seed ${ seed }: smashed ${ f.smashes } of ${ smashes }` );
        smashed += f.smashes;
        placed += smashes;
    }
    assert.ok( smashed >= 0.5 * placed, `the line met ${ smashed } of ${ placed } fractured blocks` );
} );

function fracturedWithShadow( track: Track ): [ number, number ] {
    const segs = Array.from( { length: LENGTH }, ( _, i ) => track.segmentAt( i ) );
    let fractured = 0;
    let clear = 0;
    for ( const seg of segs )
        for ( const b of seg.blocks ) {
            if ( b.kind !== 'fractured' ) continue;
            fractured++;
            if ( shadowHazard( b, segs ) === null ) clear++;
        }
    return [ fractured, clear ];
}

test( 'every groove seed emits fractured blocks, each with a clear shadow', () => {
    const counts: number[] = [];
    for ( const seed of SEEDS ) {
        const [ fractured, clear ] = fracturedWithShadow( cached( grooveTrack( seed, LENGTH ) ) );
        assert.equal( clear, fractured, `seed ${ seed }: a fractured block has a hazard in its shadow` );
        counts.push( fractured );
    }
    counts.sort( ( a, b ) => a - b );
    assert.ok( counts[ 0 ] >= 5, `min ${ counts[ 0 ] }` );
    assert.ok( counts[ counts.length >> 1 ] >= 15, `median ${ counts[ counts.length >> 1 ] }` );
} );

test( 'groove pickup ids are unique, stable, and deal a different power order per seed', () => {
    const orders = new Set< string >();
    for ( const seed of SEEDS ) {
        const ids = grooveTrack( seed, LENGTH ).anchors.map( ( a ) => a.id );
        assert.equal( new Set( ids ).size, ids.length, `seed ${ seed }: duplicate pickup id` );
        assert.deepEqual(
            ids,
            grooveTrack( seed, LENGTH ).anchors.map( ( a ) => a.id ),
        );
        assert.ok( ids.every( ( id ) => id.endsWith( `.${ pickupSalt( seed ) }` ) ) );
        orders.add( ids.map( ( id ) => pickupPower( id ) ).join( '' ) );
    }
    assert.ok( orders.size >= SEEDS.length - 1, `${ orders.size } distinct power orders over ${ SEEDS.length } seeds` );
} );
