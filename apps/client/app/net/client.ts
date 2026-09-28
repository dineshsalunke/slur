import { Client } from '@colyseus/sdk';

let client: Client | null = null;

function endpoint(): string {
    const { protocol, host, hostname } = window.location;
    if ( import.meta.env.DEV ) return `ws://${ hostname }:${ import.meta.env.VITE_SERVER_PORT || '2567' }`;
    return `${ protocol === 'https:' ? 'wss' : 'ws' }://${ host }`;
}

export function getClient(): Client {
    if ( ! client ) client = new Client( endpoint() );
    return client;
}
