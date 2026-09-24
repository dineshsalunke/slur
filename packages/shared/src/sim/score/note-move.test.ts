import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    CONTRACT_TUNING,
    measureNoteMoves,
    NOTE_MOVE_S,
    SHIP_CLASSES,
    strafePlan,
    TRACK_CONTRACT,
} from '../../index.js';

function near( actual: number, expected: number, tol = 5e-4 ): void {
    assert.ok( Math.abs( actual - expected ) < tol, `${ actual } is not ${ expected }` );
}

test( 'the pilot reproduces the RFC §3 contract move times', () => {
    near( NOTE_MOVE_S.step1, 0.367 );
    near( NOTE_MOVE_S.step2, 0.55 );
    near( NOTE_MOVE_S.jump, 0.517 );
    near( NOTE_MOVE_S.double, 1.15 );
    assert.ok( NOTE_MOVE_S.held > NOTE_MOVE_S.step2 );
} );

test( 'the contract ship is the least agile reference and flies at the register cruise', () => {
    assert.equal( CONTRACT_TUNING.strafeAccel, TRACK_CONTRACT.weaveStrafeAccel );
    assert.equal( CONTRACT_TUNING.strafeClamp, TRACK_CONTRACT.weaveStrafeClamp );
    assert.equal( CONTRACT_TUNING.maxCruise, TRACK_CONTRACT.registerCruise );
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const m = measureNoteMoves( c.tuning );
        assert.ok( m.step1 <= NOTE_MOVE_S.step1 && m.step2 <= NOTE_MOVE_S.step2, c.id );
    }
} );

test( 'a strafe plan settles by counter-pressing and a ship too weak to settle has none', () => {
    const plan = strafePlan( CONTRACT_TUNING, 8 );
    assert.ok( plan !== null && plan.reverse > 0 );
    assert.equal( strafePlan( { ...CONTRACT_TUNING, strafeAccel: 1, strafeClamp: 1 }, 8 ), null );
    assert.equal( measureNoteMoves( { ...CONTRACT_TUNING, strafeAccel: 1, strafeClamp: 1 } ).step2, Infinity );
} );
