import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as fiber from '@react-three/fiber';
import { describe, expect, it } from 'vitest';

/**
 * Pins the UPSTREAM mechanism the frame tap stands on, so a dependency bump cannot silently route a pumped
 * frame around the EffectComposer and hand the art pass bloom-less frames that still look plausible.
 *
 * These assertions read the installed packages on purpose. That is unusual for a unit test and it is the
 * point: the property being guarded lives in `@react-three/fiber` and `@react-three/postprocessing`, not in
 * our code, and it is invisible to typecheck. If one of these fails after an upgrade, the tap is not
 * necessarily broken — but the proof that it goes through bloom has expired and must be re-derived before
 * anyone judges another frame on it.
 *
 * What a GPU-less test CANNOT do is show that the two images differ by pixels; that is the live `ab=1` read,
 * demonstrated once. This guards the mechanism; the A/B demonstrates the outcome.
 */

const require_ = createRequire( import.meta.url );
// Resolved via the package ENTRY, not `<pkg>/package.json` — @react-three/postprocessing does not list
// package.json in its `exports`, so the obvious spelling throws ERR_PACKAGE_PATH_NOT_EXPORTED.
const distOf = ( pkg: string ): string => dirname( require_.resolve( pkg ) );

const readAll = ( dir: string, match: RegExp ): string =>
    readdirSync( dir )
        .filter( ( f ) => match.test( f ) )
        .map( ( f ) => readFileSync( join( dir, f ), 'utf8' ) )
        .join( '\n' );

describe( 'frame-tap upstream interlock', () => {
    it( 'fiber still exports advance() as a callable', () => {
        expect( typeof fiber.advance ).toBe( 'function' );
    } );

    it( 'fiber suppresses its own render when a priority subscriber owns it', () => {
        // `update()` ends with `if (!state.internal.priority && state.gl.render) state.gl.render(...)`. This is
        // the half that lets EffectComposer BECOME the renderer; without it a pumped frame would be drawn
        // twice, the second time without post-processing.
        const src = readAll( distOf( '@react-three/fiber' ), /\.cjs\.dev\.js$/ );
        expect( src ).toMatch( /!\s*state\.internal\.priority\s*&&\s*state\.gl\.render/ );
    } );

    it( 'fiber counts only priority > 0 subscribers as taking render ownership', () => {
        // Why `<FrameTap/>`'s delta observer is registered at priority 0: at any higher priority it would
        // increment this counter and steal render ownership from the composer.
        const src = readAll( distOf( '@react-three/fiber' ), /\.cjs\.dev\.js$/ );
        expect( src ).toMatch( /internal\.priority\s*=\s*internal\.priority\s*\+\s*\(\s*priority\s*>\s*0/ );
    } );

    it( 'postprocessing still mounts its composer at a non-zero render priority', () => {
        // The other half: `useFrame( …, enabled ? renderPriority : 0 )` with `renderPriority = 1`. The prop
        // name survives minification because it is public API, which is what makes this readable at all.
        const src = readAll( distOf( '@react-three/postprocessing' ), /^index\.js$/ );
        expect( src ).toMatch( /renderPriority\s*:\s*\w+\s*=\s*1\b/ );
    } );
} );
