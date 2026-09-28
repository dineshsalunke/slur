import { STALL_SECONDS, STALL_WARN_SECONDS } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { idleText } from './idle-warning.utils';

describe( 'idleText', () => {
    it( 'stays blank before the warning threshold', () => {
        expect( idleText( 0 ) ).toBe( '' );
        expect( idleText( STALL_WARN_SECONDS - 0.1 ) ).toBe( '' );
    } );

    it( 'counts down to the stall mark', () => {
        expect( idleText( STALL_WARN_SECONDS ) ).toBe( `Idle · out in ${ STALL_SECONDS - STALL_WARN_SECONDS }` );
        expect( idleText( STALL_SECONDS - 0.5 ) ).toBe( 'Idle · out in 1' );
    } );

    it( 'reads out once stalled', () => {
        expect( idleText( STALL_SECONDS ) ).toBe( 'Idle · out' );
    } );

    it( 'stays blank on a non-finite input', () => {
        expect( idleText( Number.NaN ) ).toBe( '' );
    } );
} );
