import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { beatDeckPlugin } from './beat-deck/beat-deck-plugin.ts';
import { frameTapPlugin } from './frame-tap-plugin.ts';

export default defineConfig( ( { mode } ) => {
    const env = loadEnv( mode, process.cwd(), '' );

    return {
        plugins: [
            tailwindcss(),
            reactRouter(),
            frameTapPlugin( { dir: resolve( process.cwd(), '../../.claude/frame-tap-refs' ) } ),
            beatDeckPlugin( { dir: resolve( process.cwd(), '.songs/takes' ) } ),
        ],
        server: {
            host: true,
            port: Number( env.CLIENT_PORT || 5173 ),
            strictPort: true,
        },
        resolve: {
            tsconfigPaths: true,
        },
        optimizeDeps: {
            exclude: [ '@slur/shared' ],
        },
    };
} );
