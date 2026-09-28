// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fullscreenForPlay } from './fullscreen';
import { FULLSCREEN_KEY } from './fullscreen.constants';

let element: Element | null = null;
const request = vi.fn( async () => {
    element = document.documentElement;
    document.dispatchEvent( new Event( 'fullscreenchange' ) );
} );
const exit = vi.fn( async () => {
    element = null;
    document.dispatchEvent( new Event( 'fullscreenchange' ) );
} );

beforeEach( () => {
    element = null;
    request.mockClear();
    localStorage.clear();
    Object.defineProperty( document, 'fullscreenEnabled', { configurable: true, get: () => true } );
    Object.defineProperty( document, 'fullscreenElement', { configurable: true, get: () => element } );
    document.documentElement.requestFullscreen = request;
    document.exitFullscreen = exit;
} );

afterEach( () => {
    Reflect.deleteProperty( document, 'fullscreenEnabled' );
} );

describe( 'fullscreenForPlay (#347)', () => {
    it( 'enters fullscreen on the first play gesture', () => {
        fullscreenForPlay();
        expect( request ).toHaveBeenCalledTimes( 1 );
    } );

    it( 'stays windowed after the player leaves fullscreen', async () => {
        fullscreenForPlay();
        await Promise.resolve();
        await document.exitFullscreen();
        expect( localStorage.getItem( FULLSCREEN_KEY ) ).toBe( 'off' );
        request.mockClear();
        fullscreenForPlay();
        expect( request ).not.toHaveBeenCalled();
    } );

    it( 'does nothing where the Fullscreen API is off (iPhone)', () => {
        Object.defineProperty( document, 'fullscreenEnabled', { configurable: true, get: () => false } );
        fullscreenForPlay();
        expect( request ).not.toHaveBeenCalled();
    } );

    it( 'does not re-request while already fullscreen', () => {
        element = document.documentElement;
        fullscreenForPlay();
        expect( request ).not.toHaveBeenCalled();
    } );
} );
