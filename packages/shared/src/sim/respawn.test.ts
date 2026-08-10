// Respawn contract, asserted against REAL generated tracks rather than a hand-built one — the failure mode
// reported in issue #6 ("the ship does not come back") is about how respawn behaves in a live hazard field,
// which a flat fixture cannot reproduce.
//
// These pin the MECHANICAL guarantees only. How hard the retry FEELS is a human-gate question and is
// deliberately not encoded here: no assertion below depends on how far a ship travels or how often it dies.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT } from '../constants.js';
import { emptyInput } from './input.js';
import { simulate } from './step.js';
import { makeTrack } from './track.js';
import { type SimShip, spawnShip } from './types.js';

const t = DEFAULT_TUNING;
const SEEDS = [ 1, 7, 13, 28, 42, 57 ]; // spread of layouts, incl. the seeds that kill a bot soonest
const MAX_TICKS = 3600; // 60s — ample; every seed kills a non-dodging ship far sooner

// Drive forward without dodging until the ship dies, then keep stepping until it is back. Returns the state
// at the death tick and at the respawn tick. A non-dodging pilot is exactly the case the issue describes.
function deathAndRespawn( seed: number ): { death: SimShip; respawn: SimShip; nextTick: SimShip } | null {
    const track = makeTrack( seed );
    const s = spawnShip( 0, 0 );
    let death: SimShip | null = null;
    let prevDead = false;

    for ( let i = 0; i < MAX_TICKS; i++ ) {
        simulate( s, { ...emptyInput(), throttle: 1, seq: i }, FIXED_DT, t, track );

        if ( s.dead && ! prevDead ) death = { ...s };
        if ( ! s.dead && prevDead && death ) {
            const respawn = { ...s };
            simulate( s, { ...emptyInput(), throttle: 1, seq: i + 1 }, FIXED_DT, t, track );
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

test( 'a respawn puts the ship BEHIND where it died, never past it', () => {
    for ( const seed of SEEDS ) {
        const r = deathAndRespawn( seed );
        assert.ok( r, `seed ${ seed }: no death + respawn` );
        assert.ok(
            r.respawn.z < r.death.z,
            `seed ${ seed }: respawned at z=${ r.respawn.z } which is not behind the death at z=${ r.death.z }`,
        );
    }
} );

// The failure the issue feared: clear of the body for one tick, invuln zeroed, dead again immediately. It
// does not happen — the setback lands the ship clear of the hazard that killed it. This is the guard that
// keeps it that way if respawnSetback or the invuln rule is ever retuned.
test( 'a respawned ship is not instantly killed again on the next tick', () => {
    for ( const seed of SEEDS ) {
        const r = deathAndRespawn( seed );
        assert.ok( r, `seed ${ seed }: no death + respawn` );
        assert.equal(
            r.nextTick.dead,
            false,
            `seed ${ seed }: died again one tick after respawning — the death-loop regression`,
        );
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
