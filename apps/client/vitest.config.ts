import { defineConfig } from 'vitest/config';

// Vitest for @slur/client. Deliberately a SEPARATE config from vite.config.ts (which loads the react-router
// plugin — that expects a full RR build/prerender context and has no place in a unit-test run). Vitest reuses
// the app's vite 8 for TS transform, so no extra transpile config is needed.
//
// `environment: node` — the current suite (matchmaking's waitForDescriptor) is pure logic over a mocked Room;
// it never touches the DOM. When a test does need the DOM (a component / hook), add `jsdom` and set the
// environment per-file with a `// @vitest-environment jsdom` docblock rather than globally, so logic tests stay
// on the cheap node runtime.
export default defineConfig( {
    test: {
        environment: 'node',
        include: [ 'app/**/*.test.ts', 'app/**/*.test.tsx' ],
    },
} );
