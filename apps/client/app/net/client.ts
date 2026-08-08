import { Client } from '@colyseus/sdk';

// The Colyseus client is a MODULE SINGLETON (created once), not owned by any route/loader — a
// clientLoader runs OUTSIDE React and can't read a context Provider, so a singleton is what makes
// loader-access work (C4). Lazy so importing this module never touches `window` (keeps the root
// prerender SSR-safe); the socket URL is only resolved when we actually connect, in the browser.
let client: Client | null = null;

export function getClient(): Client {
    if ( ! client ) {
        // Derive the host from the page so a LAN peer hitting http://<host>:5173 talks to that same
        // host's server on :2567 (not hard-coded localhost).
        client = new Client( `ws://${ window.location.hostname }:2567` );
    }
    return client;
}
