import { afterEach, describe, expect, it } from 'vitest';
import { currentInput } from './current-input';
import { JUMP_LATCH_MS, latchJump, takeJumpLatch } from './jump-latch';
import { holdStick, moveStick, pressJump, releaseAllTouch, releasePointer } from './touch-state';

afterEach( () => {
    releaseAllTouch();
    takeJumpLatch();
} );

describe( 'currentInput', () => {
    it( 'bumps seq once per read', () => {
        const a = currentInput().seq;
        expect( currentInput().seq ).toBe( a + 1 );
    } );

    it( 'thrusts while the stick is touched and strafes when pushed (#346)', () => {
        expect( holdStick( 1 ) ).toBe( true );
        expect( currentInput().throttle ).toBe( 1 );
        moveStick( 1, -0.6, 0 );
        expect( currentInput().strafe ).toBe( 1 );
        moveStick( 1, 0.6, 0 );
        expect( currentInput().strafe ).toBe( -1 );
        releasePointer( 1 );
        expect( currentInput().throttle ).toBe( 0 );
        expect( currentInput().strafe ).toBe( 0 );
    } );

    it( 'holds strafe inside the hysteresis band so a jittering thumb cannot re-press (#346)', () => {
        holdStick( 1 );
        moveStick( 1, -0.5, 0 );
        moveStick( 1, -0.3, 0 );
        expect( currentInput().strafe ).toBe( 1 );
        moveStick( 1, -0.2, 0 );
        expect( currentInput().strafe ).toBe( 0 );
        moveStick( 1, -0.4, 0 );
        expect( currentInput().strafe ).toBe( 0 );
    } );

    it( 'brakes instead of thrusting when the stick is pulled down (#346)', () => {
        holdStick( 1 );
        moveStick( 1, 0, 0.6 );
        expect( currentInput().brake ).toBe( 1 );
        expect( currentInput().throttle ).toBe( 0 );
        moveStick( 1, 0, 0.2 );
        expect( currentInput().brake ).toBe( 0 );
        expect( currentInput().throttle ).toBe( 1 );
    } );

    it( 'lets one pointer own the stick', () => {
        holdStick( 1 );
        expect( holdStick( 2 ) ).toBe( false );
        moveStick( 2, 1, 0 );
        expect( currentInput().strafe ).toBe( 0 );
    } );

    it( 'reports a jump tap released before the next read', () => {
        pressJump( 1 );
        releasePointer( 1 );
        expect( currentInput().jump ).toBe( true );
        expect( currentInput().jump ).toBe( false );
    } );
} );

describe( 'jump latch', () => {
    it( 'expires so a lobby press does not jump at GO', () => {
        latchJump( 0 );
        expect( takeJumpLatch( JUMP_LATCH_MS + 1 ) ).toBe( false );
    } );

    it( 'is taken once', () => {
        latchJump( 0 );
        expect( takeJumpLatch( 1 ) ).toBe( true );
        expect( takeJumpLatch( 2 ) ).toBe( false );
    } );
} );
