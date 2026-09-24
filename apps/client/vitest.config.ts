import { defineConfig } from 'vitest/config';

export default defineConfig( {
    test: {
        environment: 'node',
        include: [ 'app/**/*.test.ts', 'app/**/*.test.tsx', '*.test.ts', 'beat-deck/**/*.test.ts' ],
    },
} );
