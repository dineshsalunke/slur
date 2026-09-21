import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as fiber from '@react-three/fiber';
import { describe, expect, it } from 'vitest';

const require_ = createRequire( import.meta.url );
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
        const src = readAll( distOf( '@react-three/fiber' ), /\.cjs\.dev\.js$/ );
        expect( src ).toMatch( /!\s*state\.internal\.priority\s*&&\s*state\.gl\.render/ );
    } );

    it( 'fiber counts only priority > 0 subscribers as taking render ownership', () => {
        const src = readAll( distOf( '@react-three/fiber' ), /\.cjs\.dev\.js$/ );
        expect( src ).toMatch( /internal\.priority\s*=\s*internal\.priority\s*\+\s*\(\s*priority\s*>\s*0/ );
    } );

    it( 'postprocessing still mounts its composer at a non-zero render priority', () => {
        const src = readAll( distOf( '@react-three/postprocessing' ), /^index\.js$/ );
        expect( src ).toMatch( /renderPriority\s*:\s*\w+\s*=\s*1\b/ );
    } );
} );
