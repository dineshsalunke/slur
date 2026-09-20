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
            artRefsPlugin( {
                dir: resolve( process.cwd(), '../../docs/art-direction/blocks' ),
                route: '/art-refs-blocks',
            } ),
            // Also dev-only. Writes tapped frames into the art-pass refs dir, which is already gitignored
            // (`.claude/art-pass/.gitignore` ignores `*/refs/`) — see frame-tap-plugin.ts.
            frameTapPlugin( { dir: resolve( process.cwd(), '../../.claude/art-pass/00-frame-tap/refs' ) } ),
        ],
        // `host: true` binds all interfaces so the LAN can reach the dev server; Vite defaults to
        // localhost-only. The ws host comes from window.location.hostname (net/client.ts).
        server: {
            host: true,
            // `||` (not `??`): an empty `CLIENT_PORT=` is `""`, which `??` would keep → `Number("")` = 0 = a random OS port.
            port: Number( env.CLIENT_PORT || 5173 ),
            // Fail on EADDRINUSE rather than Vite's silent +1: a moved port leaves Chrome and
            // `__frame-tap` pointed at another worktree's stack, looking fine.
            strictPort: true,
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
