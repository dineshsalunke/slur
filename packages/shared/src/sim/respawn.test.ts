import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT, type FlightTuning } from '../constants.js';
import { emptyInput } from './input.js';
import { isFullSpan, isHole, START_SAFE, TRACK_SEGMENTS, type Track } from './space.js';
import { simulate } from './step.js';
import { resolveTrack } from './track-provider.js';
import { type SimShip, spawnShip } from './types.js';

const t = DEFAULT_TUNING;
const makeTrack = ( seed: number ): Track =>
    resolveTrack( { kind: 'procgen', seed, tier: 0, length: TRACK_SEGMENTS, blockDensity: 0 } );
const blockTrack = ( seed: number ): Track =>
    resolveTrack( { kind: 'procgen', seed, tier: 0, length: TRACK_SEGMENTS } );
const SEEDS = [ 1, 7, 13, 28, 42, 57 ];
const MAX_TICKS = 3600;
const GAP_TICKS = 600;
const RUN_UP = 8;
const LANE_STEP = 2;
const DECK_LIMIT = t.halfWidth - t.halfW;

interface Probe {
    death: SimShip;
    respawn: SimShip;
    nextTick: SimShip;
}

function probe( track: Track, s: SimShip, tuning: FlightTuning, maxTicks: number ): Probe | null {
    let death: SimShip | null = null;
    let prevDead = false;

    for ( let i = 0; i < maxTicks; i++ ) {
        simulate( s, { ...emptyInput(), throttle: 1, seq: i }, FIXED_DT, tuning, track );

        if ( s.dead && ! prevDead ) death = { ...s };
        if ( ! s.dead && prevDead && death ) {
            const respawn = { ...s };
            simulate( s, { ...emptyInput(), throttle: 1, seq: i + 1 }, FIXED_DT, tuning, track );
            return { death, respawn, nextTick: { ...s } };
        }
        prevDead = s.dead;
    }
    return null;
}

function deathAndRespawn( seed: number, tuning: FlightTuning = t ): Probe | null {
    return probe( makeTrack( seed ), spawnShip( 0, 0 ), tuning, MAX_TICKS );
}

function overlapsBlock( track: Track, s: SimShip ): boolean {
    for ( const z of [ s.z - t.halfL, s.z + t.halfL ] ) {
        for ( const b of track.segmentAtZ( z ).blocks ) {
            const inX = s.x + t.halfW > b.x0 && s.x - t.halfW < b.x1;
            const inZ = s.z + t.halfL > b.z0 && s.z - t.halfL < b.z1;
            if ( inX && inZ && s.y < b.y1 ) return true;
        }
    }
    return false;
}

function runUpShip( track: Track, gapIndex: number, x: number ): SimShip | null {
    const z = track.segmentAt( gapIndex ).z0 - RUN_UP;
    const floor = track.segmentAtZ( z ).floors.find( ( f ) => isFullSpan( f ) && x >= f.x0 && x <= f.x1 );
    if ( ! floor ) return null;
    const s = spawnShip( x, z );
    s.y = floor.y;
    s.vz = t.maxCruise;
    return overlapsBlock( track, s ) ? null : s;
}

function gapEdges( track: Track ): number[] {
    const edges: number[] = [];
    for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
        if ( isHole( track.segmentAt( i ) ) && ! isHole( track.segmentAt( i - 1 ) ) ) edges.push( i );
    }
    return edges;
}

interface GapProbe extends Probe {
    label: string;
    track: Track;
}

function probeGaps( seed: number ): GapProbe[] {
    const track = blockTrack( seed );
    const out: GapProbe[] = [];
    for ( const gap of gapEdges( track ) ) {
        for ( let x = -DECK_LIMIT; x <= DECK_LIMIT; x += LANE_STEP ) {
            const s = runUpShip( track, gap, x );
            const r = s && probe( track, s, t, GAP_TICKS );
            if ( r ) out.push( { ...r, label: `seed ${ seed } gap ${ gap } x=${ x.toFixed( 1 ) }`, track } );
        }
    }
    return out;
}

let gapProbeCache: GapProbe[] | null = null;
function gapProbes(): GapProbe[] {
    gapProbeCache ??= SEEDS.flatMap( probeGaps );
    return gapProbeCache;
}

test( 'a respawned ship comes back alive, grounded, and on a floor', () => {
    for ( const seed of SEEDS ) {
        const r = deathAndRespawn( seed );
        assert.ok( r, `seed ${ seed }: the probe never produced a death + respawn` );
        assert.equal( r.respawn.dead, false, `seed ${ seed }: still dead after the respawn delay` );
        assert.equal( r.respawn.grounded, true, `seed ${ seed }: respawned airborne` );
        assert.ok( r.respawn.y >= t.deathY, `seed ${ seed }: respawned below the kill plane` );
        assert.equal( r.respawn.stunTimer, 0, `seed ${ seed }: a stun carried across the respawn` );
        assert.equal( r.respawn.jumpsUsed, 0, `seed ${ seed }: jumps did not reset` );
    }
} );

test( 'a respawn puts the ship BEHIND where it died, and on its last safe lateral anchor', () => {
    for ( const seed of SEEDS ) {
        const r = deathAndRespawn( seed );
        assert.ok( r, `seed ${ seed }: no death + respawn` );
        assert.ok(
            r.respawn.z < r.death.z,
            `seed ${ seed }: respawned at z=${ r.respawn.z } which is not behind the death at z=${ r.death.z }`,
        );
        assert.equal( r.respawn.x, r.death.lastSafeX, `seed ${ seed }: respawn ignored the safe lateral anchor` );
    }
} );

test( 'respawnSetback actually drives how far back the ship lands', () => {
    for ( const seed of SEEDS ) {
        const normal = deathAndRespawn( seed );
        const doubled = deathAndRespawn( seed, { ...t, respawnSetback: t.respawnSetback * 2 } );
        assert.ok( normal && doubled, `seed ${ seed }: no death + respawn` );
        assert.ok(
            doubled.respawn.z < normal.respawn.z,
            `seed ${ seed }: doubling respawnSetback did not move the respawn back ` +
                `(${ doubled.respawn.z } vs ${ normal.respawn.z }) — the setback is not wired`,
        );
    }
} );

test( 'a respawn is not immediately lethal', () => {
    for ( const seed of SEEDS ) {
        const r = deathAndRespawn( seed );
        assert.ok( r, `seed ${ seed }: no death + respawn` );
        assert.equal( r.nextTick.dead, false, `seed ${ seed }: died again one tick after respawning` );
    }
} );

test( 'respawn grants invuln, and clearing the hazard spends it immediately', () => {
    const track = makeTrack( 28 );
    const s = spawnShip( 0, 0 );
    let prevDead = false;

    for ( let i = 0; i < MAX_TICKS; i++ ) {
        simulate( s, { ...emptyInput(), throttle: 1, seq: i }, FIXED_DT, t, track );
        if ( ! s.dead && prevDead ) {
            assert.ok( s.invulnTimer > 0, 'respawn did not grant invulnerability' );
            simulate( s, { ...emptyInput(), throttle: 1, seq: i + 1 }, FIXED_DT, t, track );
            assert.equal( s.invulnTimer, 0, 'invuln outlived the first tick clear of every body' );
            return;
        }
        prevDead = s.dead;
    }
    assert.fail( 'the probe never produced a respawn' );
} );

test( 'on a track with blocks, every seed still has gap deaths to probe', () => {
    for ( const seed of SEEDS ) {
        assert.ok(
            gapProbes().some( ( p ) => p.label.startsWith( `seed ${ seed } ` ) ),
            `seed ${ seed }: no run-up into a gap ended in a death + respawn`,
        );
    }
} );

test( 'on a track with blocks, a gap death respawns alive, grounded, behind, and on its safe anchor', () => {
    for ( const r of gapProbes() ) {
        assert.equal( r.respawn.grounded, true, `${ r.label }: respawned airborne` );
        assert.ok( r.respawn.y >= t.deathY, `${ r.label }: respawned below the kill plane` );
        assert.equal( r.respawn.stunTimer, 0, `${ r.label }: a stun carried across the respawn` );
        assert.ok(
            r.respawn.z < r.death.z,
            `${ r.label }: respawned at z=${ r.respawn.z }, not behind z=${ r.death.z }`,
        );
        assert.equal( r.respawn.x, r.death.lastSafeX, `${ r.label }: respawn ignored the safe lateral anchor` );
        assert.equal( r.nextTick.dead, false, `${ r.label }: died again one tick after respawning` );
        assert.equal( r.nextTick.stunTimer, 0, `${ r.label }: bounced one tick after respawning` );
    }
} );

test( 'a respawn that lands inside a block phases out of it under invuln instead of bouncing', () => {
    const inside = gapProbes().filter( ( p ) => overlapsBlock( p.track, p.respawn ) );
    assert.ok( inside.length > 0, 'no probe respawned inside a block, so this test proves nothing; change the seeds' );
    for ( const r of inside ) {
        const s = { ...r.respawn };
        for ( let i = 0; overlapsBlock( r.track, s ); i++ ) {
            assert.ok( s.invulnTimer > 0, `${ r.label }: invuln ran out while the ship was still inside the block` );
            assert.equal( s.dead, false, `${ r.label }: died while phasing out of the block` );
            simulate( s, { ...emptyInput(), throttle: 1, seq: i }, FIXED_DT, t, r.track );
            assert.equal( s.stunTimer, 0, `${ r.label }: the block bounced a ship that respawned inside it` );
        }
    }
} );
