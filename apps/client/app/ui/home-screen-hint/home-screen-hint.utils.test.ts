import { describe, expect, it } from 'vitest';
import { needsHomeScreenHint } from './home-screen-hint.utils';

const iphoneTab = { standalone: false, fullscreenEnabled: false, displayStandalone: false, dismissed: false };

describe( 'needsHomeScreenHint (#347)', () => {
    it( 'shows on an iPhone browser tab', () => {
        expect( needsHomeScreenHint( iphoneTab ) ).toBe( true );
    } );

    it( 'hides once launched from the Home Screen', () => {
        expect( needsHomeScreenHint( { ...iphoneTab, standalone: true } ) ).toBe( false );
        expect( needsHomeScreenHint( { ...iphoneTab, displayStandalone: true } ) ).toBe( false );
    } );

    it( 'hides where the Fullscreen API works (iPad, desktop, Android)', () => {
        expect( needsHomeScreenHint( { ...iphoneTab, fullscreenEnabled: true } ) ).toBe( false );
        expect( needsHomeScreenHint( { ...iphoneTab, standalone: undefined } ) ).toBe( false );
    } );

    it( 'hides after the player dismisses it', () => {
        expect( needsHomeScreenHint( { ...iphoneTab, dismissed: true } ) ).toBe( false );
    } );
} );
