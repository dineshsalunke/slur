import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig( {
    plugins: [ reactRouter() ],
    resolve: {
        tsconfigPaths: true,
    },
    // Consume @slur/shared as a live workspace dep so Vite HMRs on its tsc rebuilds,
    // instead of pre-bundling (and freezing) it. See monorepo.md, Gotchas §6.
    optimizeDeps: {
        exclude: [ '@slur/shared' ],
    },
} );
