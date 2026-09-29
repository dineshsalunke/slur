// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function fresh() {
    vi.resetModules();
    return import( './rear-view-toggle' );
}

function press( init: KeyboardEventInit = {} ): void {
    document.body.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'KeyB', bubbles: true, ...init } ) );
}

describe( 'rear-view toggle (#367, #368)', () => {
    beforeEach( () => localStorage.clear() );

    it( 'shows the mirror by default and B toggles it', async () => {
        const { rearViewShown } = await fresh();
        expect( rearViewShown() ).toBe( true );
        press();
        expect( rearViewShown() ).toBe( false );
        press();
        expect( rearViewShown() ).toBe( true );
    } );

    it( 'ignores repeat, Ctrl, Meta, Alt and typing in a field', async () => {
        const { rearViewShown } = await fresh();
        press( { repeat: true } );
        press( { ctrlKey: true } );
        press( { metaKey: true } );
        press( { altKey: true } );
        const field = document.createElement( 'input' );
        document.body.append( field );
        field.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'KeyB', bubbles: true } ) );
        field.remove();
        expect( rearViewShown() ).toBe( true );
    } );

    it( 'remembers a hidden mirror across a reload', async () => {
        const first = await fresh();
        first.handleRearViewKey( new KeyboardEvent( 'keydown', { code: 'KeyB' } ) );
        expect( localStorage.getItem( first.REAR_VIEW_STORE_KEY ) ).toBe( 'off' );
        const reloaded = await fresh();
        expect( reloaded.rearViewShown() ).toBe( false );
    } );
} );
