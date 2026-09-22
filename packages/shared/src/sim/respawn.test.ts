import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT, type FlightTuning } from '../constants.js';
import { emptyInput } from './input.js';
import type { Track } from './space.js';
import { simulate } from './step.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';
import { type SimShip, spawnShip } from './types.js';

const t = DEFAULT_TUNING;
const makeTrack = ( seed: number ): Track => resolveTrack( procgenDescriptor( seed ) );
const SEEDS = [ 1, 7, 13, 28, 42, 57 ];
const MAX_TICKS = 3600;

function deathAndRespawn(
    seed: number,
    tuning: FlightTuning = t,
): { death: SimShip; respawn: SimShip; nextTick: SimShip } | null {
    const track = makeTrack( seed );
    const s = spawnShip( 0, 0 );
    let death: SimShip | null = null;
    let prevDead = false;

    for ( let i = 0; i < MAX_TICKS; i++ ) {
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
