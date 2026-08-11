import { Client } from '@colyseus/sdk';

// The Colyseus client is a MODULE SINGLETON (created once), not owned by any route/loader — a
// clientLoader runs OUTSIDE React and can't read a context Provider, so a singleton is what makes
// loader-access work (C4). Lazy so importing this module never touches `window` (keeps the root
// prerender SSR-safe); the socket URL is only resolved when we actually connect, in the browser.
let client: Client | null = null;

export function getClient(): Client {
    if ( ! client ) {
        // Derive the host from the page so a LAN peer hitting http://<host>:<CLIENT_PORT> talks to
        // that same host's server (not hard-coded localhost). The server port is env-driven so a
        // second worktree can run its own stack on a distinct pair (issue #59); Vite inlines
        // import.meta.env.VITE_SERVER_PORT at build/dev, defaulting to 2567. `||` (not `??`): an
        // empty `VITE_SERVER_PORT=` is `""`, which `??` would keep → a portless `ws://host:` URL.
        const serverPort = import.meta.env.VITE_SERVER_PORT || '2567';
        client = new Client( `ws://${ window.location.hostname }:${ serverPort }` );
    }
    return client;
}
