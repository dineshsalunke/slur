import { DEADLINE_SHOW_SECONDS } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { deadlineText } from './race-deadline.utils';

describe( 'deadlineText', () => {
    it( 'hides the cap until its last minute', () => {
        expect( deadlineText( 100, 0, 286 ) ).toBe( '' );
        expect( deadlineText( 286 - DEADLINE_SHOW_SECONDS, 0, 286 ) ).toBe( 'Race ends 01:00' );
    } );

    it( 'shows the grace countdown as soon as someone finishes', () => {
        expect( deadlineText( 70, 115, 286 ) ).toBe( 'Race ends 00:45' );
    } );

    it( 'takes the cap when it lands before the grace deadline', () => {
        expect( deadlineText( 270, 300, 286 ) ).toBe( 'Race ends 00:16' );
    } );

    it( 'stays blank in an open-ended run (raceCap 0)', () => {
        expect( deadlineText( 70, 115, 0 ) ).toBe( '' );
    } );

    it( 'rounds the remaining time up', () => {
        expect( deadlineText( 70.2, 115, 286 ) ).toBe( 'Race ends 00:45' );
    } );
} );
