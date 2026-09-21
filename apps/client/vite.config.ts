import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { artRefsPlugin } from './art-refs-plugin.ts';
import { frameTapPlugin } from './frame-tap-plugin.ts';

export default defineConfig( ( { mode } ) => {
    const env = loadEnv( mode, process.cwd(), '' );

    return {
        plugins: [
            tailwindcss(),
            reactRouter(),
            artRefsPlugin( { dir: resolve( process.cwd(), '../../docs/art-direction/boards' ) } ),
            artRefsPlugin( {
                dir: resolve( process.cwd(), '../../docs/art-direction/blocks' ),
                route: '/art-refs-blocks',
            } ),
            frameTapPlugin( { dir: resolve( process.cwd(), '../../.claude/art-pass/00-frame-tap/refs' ) } ),
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
