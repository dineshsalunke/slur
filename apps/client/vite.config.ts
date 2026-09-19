import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
// Explicit `.ts` extension: Vite 8's forthcoming native config loader cannot resolve extensionless
// relative imports in vite.config and warns on every run without it.
import { artRefsPlugin } from './art-refs-plugin.ts';
import { frameTapPlugin } from './frame-tap-plugin.ts';

export default defineConfig( ( { mode } ) => {
    // loadEnv (not process.env) so CLIENT_PORT can live in a per-worktree apps/client/.env —
    // vite.config runs in Node and process.env does NOT include .env-file vars. The '' prefix
    // loads unprefixed vars too (VITE_-prefixed ones still reach client code via import.meta.env).
    // Lets two agents run concurrent dev stacks on distinct ports without EADDRINUSE (issue #59).
    const env = loadEnv( mode, process.cwd(), '' );

    return {
        // Tailwind's Vite plugin ahead of reactRouter(): the official Vite guide doesn't mandate an order, so
        // we follow tailwind.md — Tailwind first, so its CSS transform runs before RR's build hooks (SPA mode).
        // `artRefsPlugin` is dev-only (apply: 'serve') and serves the frozen concept boards to the
        // `/iso-*` isolation labs straight out of docs/art-direction — see art-refs-plugin.ts for why
        // it is a middleware and not 24 MB of copied PNGs. process.cwd() is apps/client (same assumption
        // loadEnv above already makes).
        plugins: [
            tailwindcss(),
            reactRouter(),
            artRefsPlugin( { dir: resolve( process.cwd(), '../../docs/art-direction/boards' ) } ),
            // Also dev-only. Writes tapped frames into the art-pass refs dir, which is already gitignored
            // (`.claude/art-pass/.gitignore` ignores `*/refs/`) — see frame-tap-plugin.ts.
            frameTapPlugin( { dir: resolve( process.cwd(), '../../.claude/art-pass/00-frame-tap/refs' ) } ),
        ],
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
