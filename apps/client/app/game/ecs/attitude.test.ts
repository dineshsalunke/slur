import { DEFAULT_TUNING } from '@slur/shared';
import { Object3D } from 'three';
import { assert, describe, expect, it } from 'vitest';
import { type AttitudeState, type BankTuning, driveAttitude } from './attitude';

const BANK: BankTuning = { roll: 0.5, yaw: 0.12, pitch: 0.18, stiffness: 90, damping: 0.75 };

function state(): AttitudeState {
    return { roll: 0, rollVel: 0, yaw: 0, yawVel: 0, pitch: 0, pitchVel: 0 };
}

function settle( vx: number, vy: number, seconds = 2 ): { a: AttitudeState; grp: Object3D } {
    const a = state();
    const grp = new Object3D();
    const dt = 1 / 60;
    for ( let i = 0; i < Math.round( seconds / dt ); i++ ) {
        driveAttitude( a, grp, vx, vy, DEFAULT_TUNING, BANK, dt );
    }
    return { a, grp };
}

describe( 'driveAttitude', () => {
    it( 'settles a held right strafe at the full roll target, right wing down', () => {
        const { a } = settle( DEFAULT_TUNING.strafeClamp, 0 );
        expect( a.roll ).toBeCloseTo( -BANK.roll, 4 );
        expect( a.rollVel ).toBeCloseTo( 0, 3 );
    } );

    it( 'mirrors the roll for a held left strafe', () => {
        const { a } = settle( -DEFAULT_TUNING.strafeClamp, 0 );
        expect( a.roll ).toBeCloseTo( BANK.roll, 4 );
    } );

    it( 'yaws the nose toward the strafe direction', () => {
        const { a } = settle( DEFAULT_TUNING.strafeClamp, 0 );
        expect( a.yaw ).toBeCloseTo( BANK.yaw, 4 );
    } );

    it( 'pitches the nose up while rising and down while falling', () => {
        expect( settle( 0, DEFAULT_TUNING.jumpImpulse ).a.pitch ).toBeCloseTo( -BANK.pitch, 4 );
        expect( settle( 0, -DEFAULT_TUNING.jumpImpulse ).a.pitch ).toBeCloseTo( BANK.pitch, 4 );
    } );

    it( 'returns to level once the strafe stops', () => {
        const a = state();
        const grp = new Object3D();
        const dt = 1 / 60;
        for ( let i = 0; i < 120; i++ )
            driveAttitude( a, grp, DEFAULT_TUNING.strafeClamp, 0, DEFAULT_TUNING, BANK, dt );
        for ( let i = 0; i < 120; i++ ) driveAttitude( a, grp, 0, 0, DEFAULT_TUNING, BANK, dt );
        expect( a.roll ).toBeCloseTo( 0, 3 );
    } );

    it( 'lags the input rather than snapping to it', () => {
        const a = state();
        const grp = new Object3D();
        driveAttitude( a, grp, DEFAULT_TUNING.strafeClamp, 0, DEFAULT_TUNING, BANK, 1 / 60 );
        expect( Math.abs( a.roll ) ).toBeLessThan( BANK.roll * 0.25 );
    } );

    it( 'clamps beyond the strafe limit instead of over-rolling', () => {
        const { a } = settle( DEFAULT_TUNING.strafeClamp * 4, 0 );
        expect( a.roll ).toBeCloseTo( -BANK.roll, 4 );
    } );

    it( 'stays bounded across a frame hitch', () => {
        const a = state();
        const grp = new Object3D();
        for ( let i = 0; i < 40; i++ )
            driveAttitude( a, grp, DEFAULT_TUNING.strafeClamp, 0, DEFAULT_TUNING, BANK, 0.9 );
        assert( Number.isFinite( a.roll ), 'roll stayed finite' );
        expect( Math.abs( a.roll ) ).toBeLessThan( BANK.roll * 2 );
    } );

    it( 'writes the three axes onto the object euler', () => {
        const { a, grp } = settle( DEFAULT_TUNING.strafeClamp, 0 );
        expect( grp.rotation.x ).toBeCloseTo( a.pitch, 6 );
        expect( grp.rotation.y ).toBeCloseTo( a.yaw, 6 );
        expect( grp.rotation.z ).toBeCloseTo( a.roll, 6 );
    } );
} );
