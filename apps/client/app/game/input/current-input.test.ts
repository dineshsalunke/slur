import { afterEach, describe, expect, it } from 'vitest';
import { currentInput } from './current-input';
import { JUMP_LATCH_MS, latchJump, takeJumpLatch } from './jump-latch';
import { pressTouch, releaseAllTouch, releasePointer } from './touch-state';

afterEach( () => {
    releaseAllTouch();
    takeJumpLatch();
} );

describe( 'currentInput', () => {
    it( 'bumps seq once per read', () => {
        const a = currentInput().seq;
        expect( currentInput().seq ).toBe( a + 1 );
    } );

    it( 'reads a held touch control', () => {
        pressTouch( 'throttle', 1 );
        pressTouch( 'left', 2 );
        const input = currentInput();
        expect( input.throttle ).toBe( 1 );
        expect( input.strafe ).toBe( 1 );
        releasePointer( 1 );
        expect( currentInput().throttle ).toBe( 0 );
    } );

    it( 'cancels opposite strafe buttons', () => {
        pressTouch( 'left', 1 );
        pressTouch( 'right', 2 );
        expect( currentInput().strafe ).toBe( 0 );
    } );

    it( 'keeps a control held while any pointer holds it', () => {
        pressTouch( 'brake', 1 );
        pressTouch( 'brake', 2 );
        releasePointer( 1 );
        expect( currentInput().brake ).toBe( 1 );
        releasePointer( 2 );
        releasePointer( 2 );
        expect( currentInput().brake ).toBe( 0 );
    } );

    it( 'reports a jump tap released before the next read', () => {
        pressTouch( 'jump', 1 );
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
