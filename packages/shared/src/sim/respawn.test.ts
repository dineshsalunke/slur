// Respawn contract, asserted against REAL generated tracks rather than a hand-built one — the failure mode
// reported in issue #6 ("the ship does not come back") is about how respawn behaves in a live hazard field,
// which a flat fixture cannot reproduce.
//
// These pin the MECHANICAL guarantees only. How hard the retry FEELS is a human-gate question and is
// deliberately not encoded here: no assertion below depends on how far a ship travels or how often it dies.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT, type FlightTuning } from '../constants.js';
import { emptyInput } from './input.js';
import { simulate } from './step.js';
import type { Track } from './track.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';
import { type SimShip, spawnShip } from './types.js';

const t = DEFAULT_TUNING;
// ADR-001: build a procgen track from a bare seed via the provider (makeTrack folded behind resolveTrack).
const makeTrack = ( seed: number ): Track => resolveTrack( procgenDescriptor( seed ) );
const SEEDS = [ 1, 7, 13, 28, 42, 57 ]; // spread of layouts, incl. the seeds that kill a bot soonest
const MAX_TICKS = 3600; // 60s — ample; every seed kills a non-dodging ship far sooner

// Drive forward without dodging until the ship dies, then keep stepping until it is back. Returns the state
// at the death tick and at the respawn tick. A non-dodging pilot is exactly the case the issue describes.
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

// DIFFERENTIAL, on purpose. Comparing the respawn against `lastSafeZ - t.respawnSetback` would derive the
// expectation from the very constant under test — it passes even with the setback cut to 2u, which is
// exactly the kind of false confidence this suite is supposed to avoid. Doubling the knob and requiring the
// ship to land further back proves the parameter is WIRED without pinning its VALUE, so the gate stays free
// to retune it (issue #6 names respawnSetback as the likely lever).
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

// A respawn must not be immediately lethal — the setback places the ship clear of the hazard that killed it.
//
// SCOPE, stated plainly: this does NOT guard the death LOOP described on issue #6. There the ship
// re-approaches the same wall and dies again about 25 ticks later, and at vz=20 against a 12u setback a
// re-death one tick later is near arithmetically impossible — so this is weak on its own and only bites
// alongside the differential setback test above. Guarding the loop would mean asserting a survival
// DURATION, a balance expectation a legitimate retune should be free to change. That belongs to the gate.
test( 'a respawn is not immediately lethal', () => {
    for ( const seed of SEEDS ) {
        const r = deathAndRespawn( seed );
        assert.ok( r, `seed ${ seed }: no death + respawn` );
        assert.equal( r.nextTick.dead, false, `seed ${ seed }: died again one tick after respawning` );
    }
} );

// Documents the position-scoped grace deliberately chosen in step.ts: respawn grants invulnTime, and it is
// spent the first tick the ship is clear of every body. It is NOT a timed 1.5s shield, despite the tuning
// field reading that way — worth pinning so the intent survives a future edit.
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
