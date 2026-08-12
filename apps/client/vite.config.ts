import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig( ( { mode } ) => {
    // loadEnv (not process.env) so CLIENT_PORT can live in a per-worktree apps/client/.env —
    // vite.config runs in Node and process.env does NOT include .env-file vars. The '' prefix
    // loads unprefixed vars too (VITE_-prefixed ones still reach client code via import.meta.env).
    // Lets two agents run concurrent dev stacks on distinct ports without EADDRINUSE (issue #59).
    const env = loadEnv( mode, process.cwd(), '' );

    return {
        // Tailwind's Vite plugin ahead of reactRouter(): the official Vite guide doesn't mandate an order, so
        // we follow tailwind.md — Tailwind first, so its CSS transform runs before RR's build hooks (SPA mode).
        plugins: [ tailwindcss(), reactRouter() ],
        // Bind the dev server to ALL interfaces so other machines on the LAN can load
        // http://<host-ip>:5173 (office play). Vite defaults to localhost-only, which is
        // the real reason peers couldn't connect. The client reads the ws server host from
        // window.location.hostname (net/client.ts), so no endpoint config is needed here.
        server: {
            host: true,
            // `||` (not `??`): an empty `CLIENT_PORT=` is `""`, which `??` would keep → `Number("")` = 0 = a random OS port.
            port: Number( env.CLIENT_PORT || 5173 ),
        },
        resolve: {
            tsconfigPaths: true,
        },
        // Consume @slur/shared as a live workspace dep so Vite HMRs on its tsc rebuilds,
        // instead of pre-bundling (and freezing) it. See monorepo.md, Gotchas §6.
        optimizeDeps: {
            exclude: [ '@slur/shared' ],
        },
    };
} );
