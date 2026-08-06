import type { Config } from '@react-router/dev/config';

export default {
    // SPA mode: no server render at runtime. The root shell is prerendered to a static
    // index.html at build time; output is build/client, servable from any static host.
    // (Keep the initial render window-free — it runs at build time.)
    ssr: false,
} satisfies Config;
