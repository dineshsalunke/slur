import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig( {
    plugins: [ reactRouter() ],
    // Bind the dev server to ALL interfaces so other machines on the LAN can load
    // http://<host-ip>:5173 (office play). Vite defaults to localhost-only, which is
    // the real reason peers couldn't connect. The client reads the ws server host from
    // window.location.hostname (net/client.ts), so no endpoint config is needed here.
    server: {
        host: true,
        port: 5173,
    },
    resolve: {
        tsconfigPaths: true,
    },
    // Consume @slur/shared as a live workspace dep so Vite HMRs on its tsc rebuilds,
    // instead of pre-bundling (and freezing) it. See monorepo.md, Gotchas §6.
    optimizeDeps: {
        exclude: [ '@slur/shared' ],
    },
} );
